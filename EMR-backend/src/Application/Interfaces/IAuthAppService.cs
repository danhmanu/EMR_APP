using System.Threading.Tasks;
using EMR.Application.DTO.Auth;

namespace EMR.Application.Interfaces
{
    public interface IAuthAppService
    {
        Task<LoginResponseDto> LoginAsync(LoginRequest request);
        Task<MyPermissionsDto> GetMyPermissionsAsync(int userId);
        Task<MyProfileDto> GetMyProfileAsync(int userId);
        Task<MyProfileDto> UpdateMyProfileAsync(int userId, UpdateMyProfileRequest request);
        Task ChangeMyPasswordAsync(int userId, ChangeMyPasswordRequest request);
    }
}