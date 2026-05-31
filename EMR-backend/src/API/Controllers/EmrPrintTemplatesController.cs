using EMR.Domain.Entities;
using EMR.Domain.Security;
using EMR.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace EMR.Api.Controllers
{
    [ApiController]
    [Route("api/v1/emr/print-templates")]
    [EMR.Api.Filters.RoleAuthorize(SystemRoles.Admin)]
    public class EmrPrintTemplatesController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public EmrPrintTemplatesController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? group = null, [FromQuery] bool includeInactive = true)
        {
            var query = _dbContext.EmrPrintTemplates.AsNoTracking();

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
                .Select(x => EmrPrintTemplateDto.FromEntity(x))
                .ToListAsync();

            return Ok(new { success = true, data = rows });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _dbContext.EmrPrintTemplates.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (item == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy mẫu in." });
            }

            return Ok(new { success = true, data = EmrPrintTemplateDto.FromEntity(item) });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EmrPrintTemplateUpsertDto model)
        {
            var validation = ValidateModel(model);
            if (validation != null)
            {
                return BadRequest(new { success = false, message = validation });
            }

            var code = model.Code.Trim();
            var exists = await _dbContext.EmrPrintTemplates.AnyAsync(x => x.Code == code);
            if (exists)
            {
                return Conflict(new { success = false, message = "Mã mẫu in đã tồn tại." });
            }

            var now = DateTime.UtcNow;
            var entity = new EmrPrintTemplate
            {
                Code = code,
                Name = model.Name.Trim(),
                Description = NormalizeEmpty(model.Description),
                TemplateGroup = NormalizeEmpty(model.TemplateGroup) ?? "EMR",
                Version = model.Version <= 0 ? 1 : model.Version,
                PaperSize = NormalizeEmpty(model.PaperSize) ?? "A4",
                Orientation = NormalizeEmpty(model.Orientation) ?? "Portrait",
                LayoutJson = NormalizeJson(model.LayoutJson)!,
                SampleDataJson = NormalizeJson(model.SampleDataJson),
                IsActive = model.IsActive,
                IsDefault = model.IsDefault,
                CreatedAt = now,
                UpdatedAt = now
            };

            if (entity.IsDefault)
            {
                await ClearDefaultAsync(entity.TemplateGroup);
            }

            _dbContext.EmrPrintTemplates.Add(entity);
            await _dbContext.SaveChangesAsync();

            return Ok(new { success = true, data = EmrPrintTemplateDto.FromEntity(entity) });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] EmrPrintTemplateUpsertDto model)
        {
            var validation = ValidateModel(model);
            if (validation != null)
            {
                return BadRequest(new { success = false, message = validation });
            }

            var entity = await _dbContext.EmrPrintTemplates.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy mẫu in." });
            }

            var code = model.Code.Trim();
            var exists = await _dbContext.EmrPrintTemplates.AnyAsync(x => x.Id != id && x.Code == code);
            if (exists)
            {
                return Conflict(new { success = false, message = "Mã mẫu in đã tồn tại." });
            }

            entity.Code = code;
            entity.Name = model.Name.Trim();
            entity.Description = NormalizeEmpty(model.Description);
            entity.TemplateGroup = NormalizeEmpty(model.TemplateGroup) ?? "EMR";
            entity.Version = model.Version <= 0 ? 1 : model.Version;
            entity.PaperSize = NormalizeEmpty(model.PaperSize) ?? "A4";
            entity.Orientation = NormalizeEmpty(model.Orientation) ?? "Portrait";
            entity.LayoutJson = NormalizeJson(model.LayoutJson)!;
            entity.SampleDataJson = NormalizeJson(model.SampleDataJson);
            entity.IsActive = model.IsActive;
            entity.IsDefault = model.IsDefault;
            entity.UpdatedAt = DateTime.UtcNow;

            if (entity.IsDefault)
            {
                await ClearDefaultAsync(entity.TemplateGroup, entity.Id);
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { success = true, data = EmrPrintTemplateDto.FromEntity(entity) });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _dbContext.EmrPrintTemplates.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy mẫu in." });
            }

            _dbContext.EmrPrintTemplates.Remove(entity);
            await _dbContext.SaveChangesAsync();
            return Ok(new { success = true });
        }

        private async Task ClearDefaultAsync(string templateGroup, int? exceptId = null)
        {
            var defaults = await _dbContext.EmrPrintTemplates
                .Where(x => x.TemplateGroup == templateGroup && x.IsDefault && (!exceptId.HasValue || x.Id != exceptId.Value))
                .ToListAsync();

            foreach (var item in defaults)
            {
                item.IsDefault = false;
            }
        }

        private static string? ValidateModel(EmrPrintTemplateUpsertDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Code))
            {
                return "Vui lòng nhập mã mẫu in.";
            }

            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return "Vui lòng nhập tên mẫu in.";
            }

            if (string.IsNullOrWhiteSpace(model.LayoutJson))
            {
                return "Vui lòng nhập cấu hình JSON.";
            }

            if (!IsValidJson(model.LayoutJson))
            {
                return "Cấu hình JSON không hợp lệ.";
            }

            if (!string.IsNullOrWhiteSpace(model.SampleDataJson) && !IsValidJson(model.SampleDataJson))
            {
                return "Dữ liệu mẫu JSON không hợp lệ.";
            }

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
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return JToken.Parse(value).ToString(Newtonsoft.Json.Formatting.Indented);
        }

        private static string? NormalizeEmpty(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }

    public class EmrPrintTemplateUpsertDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? TemplateGroup { get; set; }
        public int Version { get; set; } = 1;
        public string? PaperSize { get; set; }
        public string? Orientation { get; set; }
        public string LayoutJson { get; set; } = string.Empty;
        public string? SampleDataJson { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; }
    }

    public class EmrPrintTemplateDto : EmrPrintTemplateUpsertDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public static EmrPrintTemplateDto FromEntity(EmrPrintTemplate entity)
        {
            return new EmrPrintTemplateDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Name = entity.Name,
                Description = entity.Description,
                TemplateGroup = entity.TemplateGroup,
                Version = entity.Version,
                PaperSize = entity.PaperSize,
                Orientation = entity.Orientation,
                LayoutJson = entity.LayoutJson,
                SampleDataJson = entity.SampleDataJson,
                IsActive = entity.IsActive,
                IsDefault = entity.IsDefault,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
