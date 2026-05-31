using Microsoft.AspNetCore.Mvc;
using EMR.Application.Interfaces;
using EMR.Domain.Exceptions;
using EMR.Domain.Interfaces;
using EMR.Domain.Entities;
using System.Threading.Tasks;
using EMR.Domain.Security;

namespace EMR.Api.Controllers
{
    [ApiController]
    [Route("api/v1/departments")]
    [EMR.Api.Filters.RoleAuthorize(SystemRoles.Admin, SystemRoles.Engineer, SystemRoles.Technician, SystemRoles.DepartmentUser, SystemRoles.Accountant, SystemRoles.Procurement)]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentsController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _departmentService.GetAllAsync();
            return Ok(new { success = true, data = list });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Department model)
        {
            try
            {
                var created = await _departmentService.CreateAsync(model);
                return Ok(new { success = true, data = created });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Department model)
        {
            try
            {
                var updated = await _departmentService.UpdateAsync(id, model);
                return Ok(new { success = true, data = updated });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _departmentService.DeleteAsync(id);
                return Ok(new { success = true });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }
    }
}
