using System.Threading.Tasks;
using EMR.Application.DTO;
using EMR.Application.Interfaces;
using EMR.Domain.Security;
using Microsoft.AspNetCore.Mvc;

namespace EMR.Api.Controllers
{
    [ApiController]
    [Route("api/v1/system-configuration")]
    [EMR.Api.Filters.RoleAuthorize(SystemRoles.Admin)]
    public class SystemConfigurationController : AuthenticatedControllerBase
    {
        private readonly ISystemConfigurationService _service;

        public SystemConfigurationController(ISystemConfigurationService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(new { success = true, data = await _service.GetAllAsync() });
        }

        [HttpGet("{code}")]
        public async Task<IActionResult> GetByCode(string code)
        {
            var config = await _service.GetByCodeAsync(code);
            if (config == null)
                return NotFound(new { success = false, message = "Configuration code not found." });

            return Ok(new { success = true, data = config });
        }

        [HttpPut]
        public async Task<IActionResult> Upsert([FromBody] SystemConfigurationBulkUpsertDto model)
        {
            return Ok(new { success = true, data = await _service.UpsertAsync(model) });
        }
    }
}
