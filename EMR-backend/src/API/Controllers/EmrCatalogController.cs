using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using EMR.Application.Constants;
using EMR.Application.Interfaces;
using EMR.Domain.Security;

namespace EMR.Api.Controllers
{
    [ApiController]
    [Route("api/v1/emr")]
    [EMR.Api.Filters.RoleAuthorize(SystemRoles.Admin, SystemRoles.Engineer, SystemRoles.Technician, SystemRoles.DepartmentUser, SystemRoles.Accountant, SystemRoles.Procurement)]
    public class EmrCatalogController : ControllerBase
    {
        private readonly IIcareWebApiService _icareWebApiService;

        public EmrCatalogController(IIcareWebApiService icareWebApiService)
        {
            _icareWebApiService = icareWebApiService;
        }

        [HttpGet("departments")]
        public IActionResult GetDepartments([FromQuery] int page = 0, [FromQuery] int pageSize = 1000)
        {
            var lstExtentURL = new Dictionary<string, string>
            {
                [Constant.limit] = page.ToString(),
                [Constant.offset] = pageSize.ToString()
            };

            var jsonresult = _icareWebApiService.CallService(ServiceCode.getCateMedexah, lstExtentURL, null, null, null);
            var upstream = JsonConvert.DeserializeObject<APIResponse>(jsonresult);
            var dataJson = upstream?.Data == null ? "[]" : JsonConvert.SerializeObject(upstream.Data);
            var departments = JsonConvert.DeserializeObject<List<EmrDepartmentDto>>(dataJson) ?? new List<EmrDepartmentDto>();
            return Ok(new { success = true, data = departments });
        }

        [HttpGet("rooms")]
        public IActionResult GetRooms([FromQuery] int page = 0, [FromQuery] int pageSize = 1000)
        {
            var lstExtentURL = new Dictionary<string, string>
            {
                [Constant.limit] = page.ToString(),
                [Constant.offset] = pageSize.ToString()
            };

            var jsonresult = _icareWebApiService.CallService(ServiceCode.getCateMedexal, lstExtentURL, null, null, null);
            var upstream = JsonConvert.DeserializeObject<APIResponse>(jsonresult);
            var dataJson = upstream?.Data == null ? "[]" : JsonConvert.SerializeObject(upstream.Data);
            var rooms = JsonConvert.DeserializeObject<List<EmrRoomDto>>(dataJson) ?? new List<EmrRoomDto>();
            return Ok(new { success = true, data = rooms });
        }

        [HttpGet("patients")]
        public IActionResult GetPatients(
            [FromQuery] int? medexalReceiveId,
            [FromQuery] string? dateFrom,
            [FromQuery] string? dateTo,
            [FromQuery] string? typeList,
            [FromQuery] int offset = 0,
            [FromQuery] int limit = 1000)
        {
            if (!medexalReceiveId.HasValue)
            {
                return Ok(new { success = true, data = new List<EmrPatientRowDto>() });
            }

            var from = string.IsNullOrWhiteSpace(dateFrom)
                ? DateTime.Today.ToString("yyyy/MM/dd 00:00:00")
                : dateFrom;
            var to = string.IsNullOrWhiteSpace(dateTo)
                ? DateTime.Today.ToString("yyyy/MM/dd 23:59:59")
                : dateTo;
            var patientTypeList = string.Equals(typeList, "ListPatientOut", StringComparison.OrdinalIgnoreCase)
                ? "ListPatientOut"
                : "ListPatientIn";

            var request = new EmrInpatientMedicalListRequest
            {
                LstPara = new List<Parameter>
                {
                    new()
                    {
                        fieldname = "medexalreceiveid",
                        operation = Operation.Contains,
                        value = medexalReceiveId.Value.ToString(),
                        typeofvalue = TypeOfValue.String
                    },
                    new()
                    {
                        fieldname = "dateFrom",
                        operation = Operation.GreaterThanOrEqual,
                        value = from,
                        typeofvalue = TypeOfValue.DateTime
                    },
                    new()
                    {
                        fieldname = "dateTo",
                        operation = Operation.LessThanOrEqual,
                        value = to,
                        typeofvalue = TypeOfValue.DateTime
                    },
                    new()
                    {
                        fieldname = "TypeList",
                        operation = Operation.Equals,
                        value = patientTypeList,
                        typeofvalue = TypeOfValue.String
                    }
                },
                Offset = offset,
                Limit = limit
            };

            var jsonresult = _icareWebApiService.CallService(ServiceCode.getListInpatientMedicalByTypeList, null, request, null, null);
            var upstream = JsonConvert.DeserializeObject<APIResponse>(jsonresult);
            var dataJson = upstream?.Data == null ? "[]" : JsonConvert.SerializeObject(upstream.Data);
            var patients = JsonConvert.DeserializeObject<List<EmrInpatientMedicalRecordDto>>(dataJson) ?? new List<EmrInpatientMedicalRecordDto>();
            var rows = patients.Select(EmrPatientRowDto.FromMedicalRecord).ToList();
            return Ok(new { success = true, data = rows });
        }
    }

    public class Parameter
    {
        public string fieldname { get; set; } = string.Empty;
        public Operation operation { get; set; }
        public object value { get; set; } = string.Empty;
        public TypeOfValue typeofvalue { get; set; }
    }

public enum Operation
{
    Equals = 0,
    GreaterThan = 1,
    GreaterThanOrEqual = 2,
    LessThan = 3,
    LessThanOrEqual = 4,
    Contains = 5,
    StartsWith = 6,
    EndsWith = 7,
    ContainsCaseSensitivity = 8
}

public enum TypeOfValue
{
    String = 0,
    Int32 = 1,
    Int64 = 2,
    Decimal = 3,
    DateTime = 4,
    Guid = 5
}

    public class EmrInpatientMedicalListRequest
    {
        [JsonProperty("lstPara")]
        public List<Parameter> LstPara { get; set; } = new();

        [JsonProperty("offset")]
        public int Offset { get; set; }

        [JsonProperty("limit")]
        public int Limit { get; set; }
    }

    public class APIResponse
    {
        public int Code { get; set; }
        public string Message { get; set; } = string.Empty;
        public object? Data { get; set; }
    }

    public class EmrDepartmentDto
    {
        public int Id { get; set; }
        public int? IdDepart { get; set; }
        public string? Code { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Decrp { get; set; }
        public bool Treatment { get; set; }
        public int Sort { get; set; }
        public int? Active { get; set; }
        public string? UserControl { get; set; }
        public string? LableControl { get; set; }
        public string? Stored { get; set; }
        public int? Siterf { get; set; }
        public string? UserCr { get; set; }
        public DateTime? TimeCr { get; set; }
        public string? UserUp { get; set; }
        public DateTime? TimeUp { get; set; }
        public string? Computer { get; set; }
        public string? IsModify { get; set; }

        [JsonExtensionData]
        public IDictionary<string, JToken>? ExtraFields { get; set; }

        [JsonProperty("iddepart")]
        private int? IdDepartRaw
        {
            set => IdDepart = value;
        }

        [JsonProperty("decrp")]
        private string? DecrpRaw
        {
            set => Decrp = value;
        }

        [JsonProperty("usercontrol")]
        private string? UserControlRaw
        {
            set => UserControl = value;
        }

        [JsonProperty("lablecontrol")]
        private string? LableControlRaw
        {
            set => LableControl = value;
        }

        [JsonProperty("siterf")]
        private int? SiterfRaw
        {
            set => Siterf = value;
        }

        [JsonProperty("usercr")]
        private string? UserCrRaw
        {
            set => UserCr = value;
        }

        [JsonProperty("timecr")]
        private DateTime? TimeCrRaw
        {
            set => TimeCr = value;
        }

        [JsonProperty("userup")]
        private string? UserUpRaw
        {
            set => UserUp = value;
        }

        [JsonProperty("timeup")]
        private DateTime? TimeUpRaw
        {
            set => TimeUp = value;
        }

        [JsonProperty("ismodify")]
        private string? IsModifyRaw
        {
            set => IsModify = value;
        }

        [JsonProperty("name")]
        private string? NameRaw
        {
            set => Name = value ?? string.Empty;
        }

        [JsonProperty("code")]
        private string? CodeRaw
        {
            set => Code = value;
        }

        [JsonProperty("active")]
        private int? ActiveRaw
        {
            set => Active = value;
        }

        [JsonProperty("treatment")]
        private bool TreatmentRaw
        {
            set => Treatment = value;
        }

        [JsonProperty("sort")]
        private int SortRaw
        {
            set => Sort = value;
        }

        [JsonProperty("stored")]
        private string? StoredRaw
        {
            set => Stored = value;
        }

        [JsonProperty("computer")]
        private string? ComputerRaw
        {
            set => Computer = value;
        }

        [JsonProperty("id")]
        private int IdRaw
        {
            set => Id = value;
        }
    }

    public class EmrPatientRowDto
    {
        public string EncounterId { get; set; } = string.Empty;
        public string EncounterCode { get; set; } = string.Empty;
        public string PatientId { get; set; } = string.Empty;
        public string HospCode { get; set; } = string.Empty;
        public string PatientCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public string? DateOfBirth { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? InsuranceNumber { get; set; }
        public string TreatmentType { get; set; } = "Noi tru";
        public string Department { get; set; } = string.Empty;
        public string? Room { get; set; }
        public string? Bed { get; set; }
        public string? AttendingDoctor { get; set; }
        public string? AdmissionDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Diagnosis { get; set; }
        public string? ChiefComplaint { get; set; }
        public bool IsLocked { get; set; }
        public bool IsSummarized { get; set; }
        public EmrInpatientMedicalRecordDto Raw { get; set; } = new();

        public static EmrPatientRowDto FromMedicalRecord(EmrInpatientMedicalRecordDto source)
        {
            return new EmrPatientRowDto
            {
                EncounterId = source.IdLine ?? source.MedicalRecordId ?? source.TransferInfoId ?? string.Empty,
                EncounterCode = source.HospitalizationCode ?? source.EmeCode ?? string.Empty,
                PatientId = source.PatId ?? string.Empty,
                HospCode = source.HospCode ?? string.Empty,
                PatientCode = source.MedicalCode ?? source.RecordCode ?? string.Empty,
                FullName = source.FullName ?? string.Empty,
                Gender = source.Sex == 25521 ? "Nam" : source.Sex == 25522 ? "Nu" : string.Empty,
                DateOfBirth = FormatBirthDate(source),
                Phone = source.Phone,
                Address = source.Address,
                InsuranceNumber = source.NoHi,
                Department = source.NameMedicalType ?? string.Empty,
                Room = source.RoomName,
                Bed = source.BedName ?? source.BebName,
                AttendingDoctor = source.DoctorName,
                AdmissionDate = source.HospitalizationDate?.ToString("yyyy-MM-dd HH:mm:ss"),
                Status = source.StatusProfileCode ?? source.StatusName ?? source.StatusTransferCode ?? string.Empty,
                Diagnosis = string.IsNullOrWhiteSpace(source.IcdIn) ? source.Reason : source.IcdIn,
                ChiefComplaint = source.Reason,
                IsLocked = false,
                IsSummarized = string.Equals(source.StatusProfileCode, "DaTongKetBenhAn", StringComparison.OrdinalIgnoreCase),
                Raw = source
            };
        }

        private static string? FormatBirthDate(EmrInpatientMedicalRecordDto source)
        {
            if (!source.YearBr.HasValue)
            {
                return null;
            }

            var month = source.MonthBr.GetValueOrDefault(1);
            var day = source.DayBr.GetValueOrDefault(1);
            return $"{source.YearBr.Value:D4}-{Math.Clamp(month, 1, 12):D2}-{Math.Clamp(day, 1, 31):D2}";
        }
    }

    public class EmrInpatientMedicalRecordDto
    {
        public string? IdLine { get; set; }
        public string? PatId { get; set; }
        public string? IdLink { get; set; }
        public string? FullName { get; set; }
        public int? YearBr { get; set; }
        public int? MonthBr { get; set; }
        public int? DayBr { get; set; }
        public int? Sex { get; set; }
        public string? EmeCode { get; set; }
        public string? MedicalCode { get; set; }
        public int? IdObject { get; set; }
        public string? ObjectCode { get; set; }
        public string? ObjectName { get; set; }
        public string? Bhi { get; set; }
        public string? StatusName { get; set; }
        public string? DoctorId { get; set; }
        public string? DoctorName { get; set; }
        public int? IsEmergency { get; set; }
        public int? TypRec { get; set; }
        public string? Address { get; set; }
        public string? Type { get; set; }
        public string? MedicalRecordId { get; set; }
        public string? TransferInfoId { get; set; }
        public int? PriceList { get; set; }
        public string? HospitalizationCode { get; set; }
        public string? HospCode { get; set; }
        public int? MedexaReceiveId { get; set; }
        public int? MedexalReceiveId { get; set; }
        public int? ProfileTemplateTypeId { get; set; }
        public int? StatusTransferId { get; set; }
        public string? StatusTransferCode { get; set; }
        public string? NameMedicalType { get; set; }
        public int? Status { get; set; }
        public int? HospitalizationTypeId { get; set; }
        public int? StatusProfileId { get; set; }
        public string? StatusProfileCode { get; set; }
        public DateTime? HospitalizationDate { get; set; }
        public DateTime? DisfrohosDate { get; set; }
        public int? TotalTreatmentDay { get; set; }
        public string? IcdIn { get; set; }
        public string? IcdOut { get; set; }
        public string? NoHi { get; set; }
        public DateTime? StrDay { get; set; }
        public DateTime? EndDay { get; set; }
        public decimal? RateHi { get; set; }
        public string? HospHiName { get; set; }
        public string? HospHiCode { get; set; }
        public string? IdLinePatientHi { get; set; }
        public int? ManagStatusId { get; set; }
        public string? Phone { get; set; }
        public DateTime? DestroyDate { get; set; }
        public string? ReasonCancel { get; set; }
        public string? HosNum { get; set; }
        public DateTime? RegDate { get; set; }
        public string? BebName { get; set; }
        public int? SourcePayAttachId { get; set; }
        public string? SourcePayAttachName { get; set; }
        public string? PriceListName { get; set; }
        public string? RecordCode { get; set; }
        public string? PatientNote { get; set; }
        public int? RoomId { get; set; }
        public string? RoomName { get; set; }
        public int? BedId { get; set; }
        public string? BedName { get; set; }
        public string? Reason { get; set; }
        public int? Siterf { get; set; }
        public string? UserCr { get; set; }
        public DateTime? TimeCr { get; set; }
        public string? UserUp { get; set; }
        public DateTime? TimeUp { get; set; }
        public string? Computer { get; set; }
        public string? IsModify { get; set; }

        [JsonExtensionData]
        public IDictionary<string, JToken>? ExtraFields { get; set; }

        [JsonProperty("idline")]
        private string? IdLineRaw { set => IdLine = value; }

        [JsonProperty("patid")]
        private string? PatIdRaw { set => PatId = value; }

        [JsonProperty("idlink")]
        private string? IdLinkRaw { set => IdLink = value; }

        [JsonProperty("fullname")]
        private string? FullNameRaw { set => FullName = value; }

        [JsonProperty("yearbr")]
        private int? YearBrRaw { set => YearBr = value; }

        [JsonProperty("monthbr")]
        private int? MonthBrRaw { set => MonthBr = value; }

        [JsonProperty("daybr")]
        private int? DayBrRaw { set => DayBr = value; }

        [JsonProperty("sex")]
        private int? SexRaw { set => Sex = value; }

        [JsonProperty("emecode")]
        private string? EmeCodeRaw { set => EmeCode = value; }

        [JsonProperty("medicalcode")]
        private string? MedicalCodeRaw { set => MedicalCode = value; }

        [JsonProperty("idobject")]
        private int? IdObjectRaw { set => IdObject = value; }

        [JsonProperty("objectcode")]
        private string? ObjectCodeRaw { set => ObjectCode = value; }

        [JsonProperty("objectname")]
        private string? ObjectNameRaw { set => ObjectName = value; }

        [JsonProperty("bhi")]
        private string? BhiRaw { set => Bhi = value; }

        [JsonProperty("statusname")]
        private string? StatusNameRaw { set => StatusName = value; }

        [JsonProperty("doctorid")]
        private string? DoctorIdRaw { set => DoctorId = value; }

        [JsonProperty("doctorname")]
        private string? DoctorNameRaw { set => DoctorName = value; }

        [JsonProperty("isemergency")]
        private int? IsEmergencyRaw { set => IsEmergency = value; }

        [JsonProperty("typrec")]
        private int? TypRecRaw { set => TypRec = value; }

        [JsonProperty("address")]
        private string? AddressRaw { set => Address = value; }

        [JsonProperty("type")]
        private string? TypeRaw { set => Type = value; }

        [JsonProperty("medicalrecordid")]
        private string? MedicalRecordIdRaw { set => MedicalRecordId = value; }

        [JsonProperty("transferinfoid")]
        private string? TransferInfoIdRaw { set => TransferInfoId = value; }

        [JsonProperty("pricelist")]
        private int? PriceListRaw { set => PriceList = value; }

        [JsonProperty("hospitalizationcode")]
        private string? HospitalizationCodeRaw { set => HospitalizationCode = value; }

        [JsonProperty("hospcode")]
        private string? HospCodeRaw { set => HospCode = value; }

        [JsonProperty("medexareceiveid")]
        private int? MedexaReceiveIdRaw { set => MedexaReceiveId = value; }

        [JsonProperty("medexalreceiveid")]
        private int? MedexalReceiveIdRaw { set => MedexalReceiveId = value; }

        [JsonProperty("profiletemplatetypeid")]
        private int? ProfileTemplateTypeIdRaw { set => ProfileTemplateTypeId = value; }

        [JsonProperty("statustranferid")]
        private int? StatusTransferIdRaw { set => StatusTransferId = value; }

        [JsonProperty("statustranfercode")]
        private string? StatusTransferCodeRaw { set => StatusTransferCode = value; }

        [JsonProperty("namemedicaltype")]
        private string? NameMedicalTypeRaw { set => NameMedicalType = value; }

        [JsonProperty("status")]
        private int? StatusRaw { set => Status = value; }

        [JsonProperty("hospitalizationtypeid")]
        private int? HospitalizationTypeIdRaw { set => HospitalizationTypeId = value; }

        [JsonProperty("statusprofileid")]
        private int? StatusProfileIdRaw { set => StatusProfileId = value; }

        [JsonProperty("statusprofilecode")]
        private string? StatusProfileCodeRaw { set => StatusProfileCode = value; }

        [JsonProperty("hospitalizationdate")]
        private DateTime? HospitalizationDateRaw { set => HospitalizationDate = value; }

        [JsonProperty("disfrohosdate")]
        private DateTime? DisfrohosDateRaw { set => DisfrohosDate = value; }

        [JsonProperty("totaltreatmentday")]
        private int? TotalTreatmentDayRaw { set => TotalTreatmentDay = value; }

        [JsonProperty("icdIn")]
        private string? IcdInRaw { set => IcdIn = value; }

        [JsonProperty("icdOut")]
        private string? IcdOutRaw { set => IcdOut = value; }

        [JsonProperty("nohi")]
        private string? NoHiRaw { set => NoHi = value; }

        [JsonProperty("strday")]
        private DateTime? StrDayRaw { set => StrDay = value; }

        [JsonProperty("endday")]
        private DateTime? EndDayRaw { set => EndDay = value; }

        [JsonProperty("ratehi")]
        private decimal? RateHiRaw { set => RateHi = value; }

        [JsonProperty("hosphiname")]
        private string? HospHiNameRaw { set => HospHiName = value; }

        [JsonProperty("hosphicode")]
        private string? HospHiCodeRaw { set => HospHiCode = value; }

        [JsonProperty("idlinepatienthi")]
        private string? IdLinePatientHiRaw { set => IdLinePatientHi = value; }

        [JsonProperty("managstatusid")]
        private int? ManagStatusIdRaw { set => ManagStatusId = value; }

        [JsonProperty("phone")]
        private string? PhoneRaw { set => Phone = value; }

        [JsonProperty("destroydate")]
        private DateTime? DestroyDateRaw { set => DestroyDate = value; }

        [JsonProperty("reasoncancel")]
        private string? ReasonCancelRaw { set => ReasonCancel = value; }

        [JsonProperty("hosnum")]
        private string? HosNumRaw { set => HosNum = value; }

        [JsonProperty("regdate")]
        private DateTime? RegDateRaw { set => RegDate = value; }

        [JsonProperty("bebname")]
        private string? BebNameRaw { set => BebName = value; }

        [JsonProperty("sourcepayattachid")]
        private int? SourcePayAttachIdRaw { set => SourcePayAttachId = value; }

        [JsonProperty("sourcepayattachname")]
        private string? SourcePayAttachNameRaw { set => SourcePayAttachName = value; }

        [JsonProperty("pricelistname")]
        private string? PriceListNameRaw { set => PriceListName = value; }

        [JsonProperty("recordcode")]
        private string? RecordCodeRaw { set => RecordCode = value; }

        [JsonProperty("patientNote")]
        private string? PatientNoteRaw { set => PatientNote = value; }

        [JsonProperty("roomid")]
        private int? RoomIdRaw { set => RoomId = value; }

        [JsonProperty("roomname")]
        private string? RoomNameRaw { set => RoomName = value; }

        [JsonProperty("bedid")]
        private int? BedIdRaw { set => BedId = value; }

        [JsonProperty("bedname")]
        private string? BedNameRaw { set => BedName = value; }

        [JsonProperty("reason")]
        private string? ReasonRaw { set => Reason = value; }

        [JsonProperty("siterf")]
        private int? SiterfRaw { set => Siterf = value; }

        [JsonProperty("usercr")]
        private string? UserCrRaw { set => UserCr = value; }

        [JsonProperty("timecr")]
        private DateTime? TimeCrRaw { set => TimeCr = value; }

        [JsonProperty("userup")]
        private string? UserUpRaw { set => UserUp = value; }

        [JsonProperty("timeup")]
        private DateTime? TimeUpRaw { set => TimeUp = value; }

        [JsonProperty("computer")]
        private string? ComputerRaw { set => Computer = value; }

        [JsonProperty("ismodify")]
        private string? IsModifyRaw { set => IsModify = value; }
    }

    public class EmrRoomDto
    {
        public int Id { get; set; }
        public int? Idh { get; set; }
        public string? Code { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Decrp { get; set; }
        public int Sort { get; set; }
        public int? Active { get; set; }
        public int? Siterf { get; set; }
        public string? UserCr { get; set; }
        public DateTime? TimeCr { get; set; }
        public string? UserUp { get; set; }
        public DateTime? TimeUp { get; set; }
        public string? Computer { get; set; }
        public string? IsModify { get; set; }

        [JsonExtensionData]
        public IDictionary<string, JToken>? ExtraFields { get; set; }

        [JsonProperty("id")]
        private int IdRaw
        {
            set => Id = value;
        }

        [JsonProperty("idh")]
        private int? IdhRaw
        {
            set => Idh = value;
        }

        [JsonProperty("code")]
        private string? CodeRaw
        {
            set => Code = value;
        }

        [JsonProperty("name")]
        private string? NameRaw
        {
            set => Name = value ?? string.Empty;
        }

        [JsonProperty("decrp")]
        private string? DecrpRaw
        {
            set => Decrp = value;
        }

        [JsonProperty("sort")]
        private int SortRaw
        {
            set => Sort = value;
        }

        [JsonProperty("active")]
        private int? ActiveRaw
        {
            set => Active = value;
        }

        [JsonProperty("siterf")]
        private int? SiterfRaw
        {
            set => Siterf = value;
        }

        [JsonProperty("usercr")]
        private string? UserCrRaw
        {
            set => UserCr = value;
        }

        [JsonProperty("timecr")]
        private DateTime? TimeCrRaw
        {
            set => TimeCr = value;
        }

        [JsonProperty("userup")]
        private string? UserUpRaw
        {
            set => UserUp = value;
        }

        [JsonProperty("timeup")]
        private DateTime? TimeUpRaw
        {
            set => TimeUp = value;
        }

        [JsonProperty("computer")]
        private string? ComputerRaw
        {
            set => Computer = value;
        }

        [JsonProperty("ismodify")]
        private string? IsModifyRaw
        {
            set => IsModify = value;
        }
    }
}
