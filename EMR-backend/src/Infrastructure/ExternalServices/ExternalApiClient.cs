using System.Net.Http.Headers;
using System.Text;
using EMR.Application.Interfaces;
using Newtonsoft.Json;

namespace EMR.Infrastructure.ExternalServices
{
    public class ExternalApiClient : IExternalApiClient
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public ExternalApiClient(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<ExternalApiResult<TResponse>> SendAsync<TResponse>(
            ExternalApiRequest request,
            CancellationToken cancellationToken = default)
        {
            using var httpRequest = new HttpRequestMessage(request.Method, request.Url);
            httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            if (request.Headers != null)
            {
                foreach (var header in request.Headers)
                {
                    httpRequest.Headers.TryAddWithoutValidation(header.Key, header.Value);
                }
            }

            if (request.Body != null)
            {
                var body = request.Body is string text ? text : JsonConvert.SerializeObject(request.Body);
                httpRequest.Content = new StringContent(body, Encoding.UTF8, "application/json");
            }

            var client = _httpClientFactory.CreateClient();
            using var response = await client.SendAsync(httpRequest, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return new ExternalApiResult<TResponse>(
                    false,
                    (int)response.StatusCode,
                    default,
                    content,
                    $"External API returned HTTP {(int)response.StatusCode}.");
            }

            var parsed = typeof(TResponse) == typeof(string)
                ? (TResponse)(object)content
                : JsonConvert.DeserializeObject<TResponse>(content);
            return new ExternalApiResult<TResponse>(
                true,
                (int)response.StatusCode,
                parsed,
                content);
        }

        public IReadOnlyList<TData> ConvertDataList<TData>(object? data)
        {
            if (data == null)
            {
                return Array.Empty<TData>();
            }

            var json = data is string text ? text : JsonConvert.SerializeObject(data);
            var parsed = JsonConvert.DeserializeObject<List<TData>>(json);
            return parsed is { Count: > 0 } ? parsed : Array.Empty<TData>();
        }
    }
}
