namespace EMR.Domain.Entities
{
    public class SysApi
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Extend { get; set; } = string.Empty;
        public string Method { get; set; } = "GET";
    }
}
