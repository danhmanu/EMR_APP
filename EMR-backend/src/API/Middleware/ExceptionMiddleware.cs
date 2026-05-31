using System;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using EMR.Domain.Exceptions;

namespace EMR.Api.Middleware
{
    /// <summary>
    /// Global exception handling middleware.
    /// Catches all unhandled exceptions and returns ASP.NET Core problem details responses.
    /// </summary>
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(httpContext, ex, _logger);
            }
        }

        private static Task HandleExceptionAsync(HttpContext httpContext, Exception exception, ILogger<ExceptionMiddleware> logger)
        {
            if (httpContext.Response.HasStarted)
            {
                logger.LogWarning(exception, "Response has already started; skip writing JSON error body.");
                return Task.CompletedTask;
            }

            httpContext.Response.ContentType = "application/json";
            ProblemDetails problemDetails;

            // Handle domain-specific exceptions
            if (exception is DomainException domainEx)
            {
                logger.LogWarning(exception, "Domain exception occurred: {Code}", domainEx.Code);
                httpContext.Response.StatusCode = domainEx.HttpStatusCode;
                problemDetails = CreateProblemDetails(
                    httpContext,
                    domainEx.HttpStatusCode,
                    domainEx.Message,
                    detail: IsEnvironmentDevelopment(httpContext) ? $"{domainEx.GetType().Name}: {domainEx.Message}" : null,
                    errorCode: domainEx.Code);
            }
            // Handle validation exceptions
            else if (exception is ArgumentException argEx)
            {
                logger.LogWarning(argEx, "Validation error: {Message}", argEx.Message);
                httpContext.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                problemDetails = CreateProblemDetails(
                    httpContext,
                    (int)HttpStatusCode.BadRequest,
                    argEx.Message,
                    detail: IsEnvironmentDevelopment(httpContext) ? $"{argEx.GetType().Name}: {argEx.Message}" : null,
                    errorCode: "VALIDATION_ERROR");
            }
            // Handle all other exceptions as internal server errors
            else
            {
                logger.LogError(exception, "An unhandled exception occurred while processing the request.");
                httpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                problemDetails = CreateProblemDetails(
                    httpContext,
                    (int)HttpStatusCode.InternalServerError,
                    "An internal server error occurred. Please try again later.",
                    detail: IsEnvironmentDevelopment(httpContext) ? exception.ToString() : null,
                    errorCode: "INTERNAL_SERVER_ERROR");
            }

            var jsonSerializerOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            };

            var result = JsonSerializer.Serialize(problemDetails, jsonSerializerOptions);
            return httpContext.Response.WriteAsync(result);
        }

        private static ProblemDetails CreateProblemDetails(
            HttpContext httpContext,
            int statusCode,
            string title,
            string? detail = null,
            string? errorCode = null)
        {
            var problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Instance = httpContext.Request.Path
            };

            problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;

            if (!string.IsNullOrWhiteSpace(errorCode))
            {
                problemDetails.Extensions["errorCode"] = errorCode;
            }

            return problemDetails;
        }

        private static bool IsEnvironmentDevelopment(HttpContext httpContext)
        {
            var env = httpContext.RequestServices.GetService(typeof(IWebHostEnvironment)) as IWebHostEnvironment;
            return env?.IsDevelopment() ?? false;
        }
    }
}

