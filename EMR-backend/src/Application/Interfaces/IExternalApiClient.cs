using System.Net.Http;

namespace EMR.Application.Interfaces
{
    public record ExternalApiRequest(
        HttpMethod Method,
        string Url,
        IDictionary<string, string>? Headers = null,
        object? Body = null);

    public record ExternalApiResult<TResponse>(
        bool IsSuccess,
        int StatusCode,
        TResponse? Data,
        string RawContent,
        string? ErrorMessage = null);

    public interface IExternalApiClient
    {
        Task<ExternalApiResult<TResponse>> SendAsync<TResponse>(
            ExternalApiRequest request,
            CancellationToken cancellationToken = default);

        IReadOnlyList<TData> ConvertDataList<TData>(object? data);
    }
}
