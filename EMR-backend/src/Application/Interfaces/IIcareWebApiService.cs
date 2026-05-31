namespace EMR.Application.Interfaces
{
    public interface IIcareWebApiService
    {
        string CallService(
            string serviceCode,
            Dictionary<string, string>? lstExtentURL,
            object? body,
            Dictionary<string, string>? headers,
            string? baseUrl);

        Task<string> CallServiceAsync(
            string serviceCode,
            Dictionary<string, string>? lstExtentURL = null,
            object? body = null,
            Dictionary<string, string>? headers = null,
            string? baseUrl = null,
            CancellationToken cancellationToken = default);
    }
}
