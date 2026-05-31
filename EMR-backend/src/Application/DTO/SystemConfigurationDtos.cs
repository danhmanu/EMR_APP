namespace EMR.Application.DTO
{
    public class SystemConfigurationDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? Value { get; set; }
        public string? Description { get; set; }
    }

    public class SystemConfigurationUpsertDto
    {
        public string? Code { get; set; }
        public string? Value { get; set; }
        public string? Description { get; set; }
    }

    public class SystemConfigurationBulkUpsertDto
    {
        public SystemConfigurationUpsertDto[] Items { get; set; } = [];
    }
}
