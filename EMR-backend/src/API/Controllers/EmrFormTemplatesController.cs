using EMR.Domain.Entities;
using EMR.Domain.Security;
using EMR.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace EMR.Api.Controllers
{
    [ApiController]
    [Route("api/v1/emr/form-templates")]
    [EMR.Api.Filters.RoleAuthorize(SystemRoles.Admin)]
    public class EmrFormTemplatesController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public EmrFormTemplatesController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? group = null, [FromQuery] bool includeInactive = true)
        {
            var query = _dbContext.EmrFormTemplates.AsNoTracking();

            if (!includeInactive)
            {
                query = query.Where(x => x.IsActive);
            }

            if (!string.IsNullOrWhiteSpace(group))
            {
                query = query.Where(x => x.TemplateGroup == group);
            }

            var rows = await query
                .OrderBy(x => x.TemplateGroup)
                .ThenBy(x => x.Name)
                .Select(x => EmrFormTemplateDto.FromEntity(x))
                .ToListAsync();

            return Ok(new { success = true, data = rows });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _dbContext.EmrFormTemplates.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (item == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy cấu hình form." });
            }

            return Ok(new { success = true, data = EmrFormTemplateDto.FromEntity(item) });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EmrFormTemplateUpsertDto model)
        {
            var validation = ValidateModel(model);
            if (validation != null)
            {
                return BadRequest(new { success = false, message = validation });
            }

            var code = model.Code.Trim();
            var exists = await _dbContext.EmrFormTemplates.AnyAsync(x => x.Code == code);
            if (exists)
            {
                return Conflict(new { success = false, message = "Mã cấu hình form đã tồn tại." });
            }

            var now = DateTime.UtcNow;
            var entity = new EmrFormTemplate
            {
                Code = code,
                Name = model.Name.Trim(),
                Description = NormalizeEmpty(model.Description),
                TemplateGroup = NormalizeEmpty(model.TemplateGroup) ?? "EMR",
                PrintTemplateCode = NormalizeEmpty(model.PrintTemplateCode),
                Version = model.Version <= 0 ? 1 : model.Version,
                LayoutJson = NormalizeJson(model.LayoutJson)!,
                DefaultDataJson = NormalizeJson(model.DefaultDataJson),
                IsActive = model.IsActive,
                IsDefault = model.IsDefault,
                CreatedAt = now,
                UpdatedAt = now
            };

            if (entity.IsDefault)
            {
                await ClearDefaultAsync(entity.TemplateGroup);
            }

            _dbContext.EmrFormTemplates.Add(entity);
            await _dbContext.SaveChangesAsync();

            return Ok(new { success = true, data = EmrFormTemplateDto.FromEntity(entity) });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] EmrFormTemplateUpsertDto model)
        {
            var validation = ValidateModel(model);
            if (validation != null)
            {
                return BadRequest(new { success = false, message = validation });
            }

            var entity = await _dbContext.EmrFormTemplates.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy cấu hình form." });
            }

            var code = model.Code.Trim();
            var exists = await _dbContext.EmrFormTemplates.AnyAsync(x => x.Id != id && x.Code == code);
            if (exists)
            {
                return Conflict(new { success = false, message = "Mã cấu hình form đã tồn tại." });
            }

            entity.Code = code;
            entity.Name = model.Name.Trim();
            entity.Description = NormalizeEmpty(model.Description);
            entity.TemplateGroup = NormalizeEmpty(model.TemplateGroup) ?? "EMR";
            entity.PrintTemplateCode = NormalizeEmpty(model.PrintTemplateCode);
            entity.Version = model.Version <= 0 ? 1 : model.Version;
            entity.LayoutJson = NormalizeJson(model.LayoutJson)!;
            entity.DefaultDataJson = NormalizeJson(model.DefaultDataJson);
            entity.IsActive = model.IsActive;
            entity.IsDefault = model.IsDefault;
            entity.UpdatedAt = DateTime.UtcNow;

            if (entity.IsDefault)
            {
                await ClearDefaultAsync(entity.TemplateGroup, entity.Id);
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { success = true, data = EmrFormTemplateDto.FromEntity(entity) });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _dbContext.EmrFormTemplates.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy cấu hình form." });
            }

            _dbContext.EmrFormTemplates.Remove(entity);
            await _dbContext.SaveChangesAsync();
            return Ok(new { success = true });
        }

        private async Task ClearDefaultAsync(string templateGroup, int? exceptId = null)
        {
            var defaults = await _dbContext.EmrFormTemplates
                .Where(x => x.TemplateGroup == templateGroup && x.IsDefault && (!exceptId.HasValue || x.Id != exceptId.Value))
                .ToListAsync();

            foreach (var item in defaults)
            {
                item.IsDefault = false;
            }
        }

        private static string? ValidateModel(EmrFormTemplateUpsertDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Code)) return "Vui lòng nhập mã cấu hình form.";
            if (string.IsNullOrWhiteSpace(model.Name)) return "Vui lòng nhập tên cấu hình form.";
            if (string.IsNullOrWhiteSpace(model.LayoutJson)) return "Vui lòng nhập cấu hình JSON.";
            if (!IsValidJson(model.LayoutJson)) return "Cấu hình JSON không hợp lệ.";
            if (!string.IsNullOrWhiteSpace(model.DefaultDataJson) && !IsValidJson(model.DefaultDataJson)) return "Dữ liệu mặc định JSON không hợp lệ.";
            return null;
        }

        private static bool IsValidJson(string value)
        {
            try
            {
                JToken.Parse(value);
                return true;
            }
            catch
            {
                return false;
            }
        }

        private static string? NormalizeJson(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            return JToken.Parse(value).ToString(Newtonsoft.Json.Formatting.Indented);
        }

        private static string? NormalizeEmpty(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }

    public class EmrFormTemplateUpsertDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? TemplateGroup { get; set; }
        public string? PrintTemplateCode { get; set; }
        public int Version { get; set; } = 1;
        public string LayoutJson { get; set; } = string.Empty;
        public string? DefaultDataJson { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; }
    }

    public class EmrFormTemplateDto : EmrFormTemplateUpsertDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public static EmrFormTemplateDto FromEntity(EmrFormTemplate entity)
        {
            return new EmrFormTemplateDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Name = entity.Name,
                Description = entity.Description,
                TemplateGroup = entity.TemplateGroup,
                PrintTemplateCode = entity.PrintTemplateCode,
                Version = entity.Version,
                LayoutJson = entity.LayoutJson,
                DefaultDataJson = entity.DefaultDataJson,
                IsActive = entity.IsActive,
                IsDefault = entity.IsDefault,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
