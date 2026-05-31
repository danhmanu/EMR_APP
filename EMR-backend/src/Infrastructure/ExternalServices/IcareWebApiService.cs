using System.Net.Http;
using EMR.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;

namespace EMR.Infrastructure.ExternalServices
{
    public class IcareWebApiService : IIcareWebApiService
    {
        private readonly IExternalApiClient _externalApiClient;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _dbContext;

        public IcareWebApiService(
            IExternalApiClient externalApiClient,
            IConfiguration configuration,
            AppDbContext dbContext)
        {
            _externalApiClient = externalApiClient;
            _configuration = configuration;
            _dbContext = dbContext;
        }

        public string CallService(
            string serviceCode,
            Dictionary<string, string>? lstExtentURL,
            object? body,
            Dictionary<string, string>? headers,
            string? baseUrl)
        {
            return CallServiceAsync(serviceCode, lstExtentURL, body, headers, baseUrl)
                .GetAwaiter()
                .GetResult();
        }

        public async Task<string> CallServiceAsync(
            string serviceCode,
            Dictionary<string, string>? lstExtentURL = null,
            object? body = null,
            Dictionary<string, string>? headers = null,
            string? baseUrl = null,
            CancellationToken cancellationToken = default)
        {
            var options = _configuration.GetSection("IcareWebApi").Get<IcareWebApiOptions>()
                ?? new IcareWebApiOptions();

            var service = await _dbContext.SysApis
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Code == serviceCode, cancellationToken);

            if (service == null)
            {
                throw new InvalidOperationException($"External service '{serviceCode}' is not configured in sysapi.");
            }

            var requestUrl = BuildUrl(baseUrl ?? options.BaseUrl, service.Extend, lstExtentURL);
            var requestHeaders = new Dictionary<string, string>(options.DefaultHeaders, StringComparer.OrdinalIgnoreCase);
            if (headers != null)
            {
                foreach (var header in headers)
                {
                    requestHeaders[header.Key] = header.Value;
                }
            }

            var method = new HttpMethod(string.IsNullOrWhiteSpace(service.Method) ? "GET" : service.Method);
            var request = new ExternalApiRequest(method, requestUrl, requestHeaders, body);
            var response = await _externalApiClient.SendAsync<string>(request, cancellationToken);

            if (!response.IsSuccess)
            {
                throw new InvalidOperationException(response.ErrorMessage ?? $"External service '{serviceCode}' failed.");
            }

            return response.RawContent;
        }

        private static string BuildUrl(string? baseUrl, string path, Dictionary<string, string>? values)
        {
            var normalizedBaseUrl = (baseUrl ?? string.Empty).TrimEnd('/');
            var normalizedPath = path.StartsWith('/') ? path : $"/{path}";
            var usedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (values != null)
            {
                foreach (var item in values)
                {
                    var token = "{" + item.Key + "}";
                    if (normalizedPath.Contains(token, StringComparison.OrdinalIgnoreCase))
                    {
                        normalizedPath = normalizedPath.Replace(token, Uri.EscapeDataString(item.Value), StringComparison.OrdinalIgnoreCase);
                        usedKeys.Add(item.Key);
                    }
                }
            }

            var remainingValues = values?
                .Where(item => !usedKeys.Contains(item.Key))
                .Select(item => Uri.EscapeDataString(item.Value))
                .ToArray();

            if (remainingValues is { Length: > 0 })
            {
                var queryIndex = normalizedPath.IndexOf('?', StringComparison.Ordinal);
                var pathOnly = queryIndex >= 0 ? normalizedPath[..queryIndex] : normalizedPath;
                var queryOnly = queryIndex >= 0 ? normalizedPath[queryIndex..] : string.Empty;
                normalizedPath = $"{pathOnly.TrimEnd('/')}/{string.Join("/", remainingValues)}{queryOnly}";
            }

            var url = $"{normalizedBaseUrl}{normalizedPath}";
            return url;
        }
    }

    public class IcareWebApiOptions
    {
        public string BaseUrl { get; set; } = "http://localhost:7770";
        public Dictionary<string, string> DefaultHeaders { get; set; } = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Siterf"] = "1",
            ["UserName"] = "admin",
            ["Token"] = "adc"
        };
    }
}
