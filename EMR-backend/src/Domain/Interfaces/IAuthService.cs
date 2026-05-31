namespace EMR.Domain.Interfaces
{
    public interface IAuthService
    {
        string HashPassword(string plain);
        bool VerifyPassword(string plain, string hash);
        string GenerateToken(int userId, string username, string? role = null);
    }
}