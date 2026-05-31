using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using EMR.Application.Interfaces;
using EMR.Domain.Interfaces;
using EMR.Infrastructure;
using EMR.Api.Filters;
using EMR.Api.Serialization;
using EMR.Infrastructure.Repositories;
using EMR.Application.Services;
using Domain.Repositories;

// Helper method to get JWT key from configuration securely
static string GetJwtKey(IConfiguration configuration)
{
    var key = configuration["Jwt:Key"];
    if (string.IsNullOrEmpty(key) || key == "change_this_to_a_secure_key_in_prod")
    {
        throw new InvalidOperationException(
            "JWT key is not configured or using default development value. " +
            "Set 'Jwt:Key' in appsettings.Production.json to a cryptographically secure key (minimum 32 characters). " +
            "Never commit secrets to source control."
        );
    }
    if (key.Length < 32)
    {
        throw new InvalidOperationException("JWT key must be at least 32 characters long for security.");
    }
    return key;
}

// Use environment from configuration or defaults to Production
var builder = WebApplication.CreateBuilder(args);

// OPTIONAL: Configure Serilog for structured logging
// Uncomment and install Serilog packages with:
//   dotnet add package Serilog.AspNetCore
//   dotnet add package Serilog.Sinks.Console
//   dotnet add package Serilog.Sinks.File
// Then uncomment below:
/*
builder.Host.UseSerilog((context, logConfig) =>
{
    logConfig
        .MinimumLevel.Information()
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "EMR.Api")
        .WriteTo.Console()
        .WriteTo.File(
            path: "logs/emr-.txt",
            rollingInterval: RollingInterval.Day,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
        );

    if (context.HostingEnvironment.IsDevelopment())
        logConfig.MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Information);
});
*/

// Configuration - get MySQL connection string from configuration
var connection = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connection))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured. Ensure appsettings.json contains the connection string.");
}
builder.Services.AddDbContext<AppDbContext>(options => options.UseMySql(connection, ServerVersion.Parse("8.0.0-mysql")));

// Register IAuthService with JWT configuration
var jwtKey = GetJwtKey(builder.Configuration);
builder.Services.AddScoped<EMR.Domain.Interfaces.IAuthService>(sp => 
    new EMR.Infrastructure.AuthService(jwtKey, int.TryParse(builder.Configuration["Jwt:ExpiryHours"], out var hours) ? hours : 8)
);

// Register repositories and application services
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthAppService, EMR.Application.Services.AuthAppService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IRoleAdminService, EMR.Application.Services.RoleAdminService>();
builder.Services.AddScoped<IPermissionAdminService, EMR.Application.Services.PermissionAdminService>();
builder.Services.AddScoped<EMR.Application.Interfaces.IMenuService, EMR.Application.Services.MenuService>();
builder.Services.AddScoped<EMR.Application.Interfaces.ISystemConfigurationService, EMR.Application.Services.SystemConfigurationService>();

// register http context accessor + current user service to populate PerformedByUserId
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<EMR.Infrastructure.ICurrentUserService, EMR.Infrastructure.CurrentUserService>();

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new ApiDateTimeJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new ApiNullableDateTimeJsonConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "EMR GIADINH API", Version = "v1" });
    var bearer = new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter 'Bearer <token>'"
    };
    c.AddSecurityDefinition("Bearer", bearer);
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement {
        { bearer, new string[] { } }
    });
});

// Authentication (JWT) config for scaffold
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options => {
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(GetJwtKey(builder.Configuration)))
    };
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var auth = context.Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrEmpty(auth) || !auth.StartsWith("Bearer ")) {
                context.Token = null;
            }
            return System.Threading.Tasks.Task.CompletedTask;
        }
    };
});

// Allow CORS from localhost for dev convenience (allow credentials from frontend)
builder.Services.AddCors(options => options.AddPolicy("LocalDev", policy => policy.WithOrigins("http://localhost:5173","http://localhost:5174").AllowCredentials().AllowAnyMethod().AllowAnyHeader().WithExposedHeaders("Content-Disposition","Content-Type")));

var app = builder.Build();

// Keep the core system tables for login, users, roles, menus and permissions.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    try
    {
        SeedData.EnsureSeed(db);
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error seeding database. Application may not function correctly.");
        throw;
    }
}

// Global exception middleware
app.UseMiddleware<EMR.Api.Middleware.ExceptionMiddleware>();


// Always enable Swagger in this dev scaffold
app.UseSwagger();
app.UseSwaggerUI();

app.UseStaticFiles(); // Enable serving static files from wwwroot
app.UseCors("LocalDev");
// Disabled HTTPS redirection for local dev to avoid browser POST redirect issues
// app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
