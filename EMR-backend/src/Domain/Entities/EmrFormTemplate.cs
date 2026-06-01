namespace EMR.Domain.Entities
{
    public class EmrFormTemplate
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string TemplateGroup { get; set; } = "EMR";
        public string? PrintTemplateCode { get; set; }
        public int Version { get; set; } = 1;
        public string LayoutJson { get; set; } = string.Empty;
        public string? DefaultDataJson { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
