namespace EMR.Domain.Entities
{
    public class SystemConfiguration
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? Value { get; set; }
        public string? Description { get; set; }
    }
}
