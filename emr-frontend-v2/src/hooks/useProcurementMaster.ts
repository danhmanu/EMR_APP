import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ApiResponse, Company, Department, DeviceType, Status } from '../types/models'
import { getCountries, getDepartments, getDeviceStatuses, getDeviceTypes, getManufacturers, listCompanies } from '../services/master'
import { listUnitCatalogs, listItemCatalogs, type UnitCatalog, type ItemCatalog } from '../services/procurement'

type LookupOption = { id: number; name: string }

function unwrapRows<T>(response: ApiResponse<T[]> | undefined): T[] {
  return Array.isArray(response?.data) ? response!.data : []
}

export const PROC_MASTER_KEYS = {
  companies: ['proc-master', 'companies'] as const,
  manufacturers: ['proc-master', 'manufacturers'] as const,
  countries: ['proc-master', 'countries'] as const,
  departments: ['proc-master', 'departments'] as const,
  deviceTypes: ['proc-master', 'deviceTypes'] as const,
  deviceStatuses: ['proc-master', 'deviceStatuses'] as const,
  units: ['proc-master', 'units'] as const,
  itemCatalogs: ['proc-master', 'itemCatalogs'] as const
}

export function useProcurementMaster() {
  const companiesQ = useQuery({
    queryKey: PROC_MASTER_KEYS.companies,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => unwrapRows<Company>(await listCompanies(1, 200))
  })
  const manufacturersQ = useQuery({
    queryKey: PROC_MASTER_KEYS.manufacturers,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => unwrapRows<LookupOption>(await getManufacturers() as ApiResponse<LookupOption[]>)
  })
  const countriesQ = useQuery({
    queryKey: PROC_MASTER_KEYS.countries,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => unwrapRows<LookupOption>(await getCountries() as ApiResponse<LookupOption[]>)
  })
  const departmentsQ = useQuery({
    queryKey: PROC_MASTER_KEYS.departments,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => unwrapRows<Department>(await getDepartments())
  })
  const deviceTypesQ = useQuery({
    queryKey: PROC_MASTER_KEYS.deviceTypes,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => unwrapRows<DeviceType>(await getDeviceTypes())
  })
  const deviceStatusesQ = useQuery({
    queryKey: PROC_MASTER_KEYS.deviceStatuses,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => unwrapRows<Status>(await getDeviceStatuses())
  })
  const unitsQ = useQuery({
    queryKey: PROC_MASTER_KEYS.units,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await listUnitCatalogs()
      return Array.isArray(response) ? response : []
    }
  })
  const itemCatalogsQ = useQuery({
    queryKey: PROC_MASTER_KEYS.itemCatalogs,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await listItemCatalogs()
      return Array.isArray(response) ? response : []
    }
  })

  const companies = companiesQ.data || []
  const manufacturers = manufacturersQ.data || []
  const countries = countriesQ.data || []
  const departments = departmentsQ.data || []
  const deviceTypes = deviceTypesQ.data || []
  const deviceStatuses = deviceStatusesQ.data || []
  const units = unitsQ.data || []
  const itemCatalogs = itemCatalogsQ.data || []

  const companyMap = useMemo(() => new Map(companies.map(c => [c.id, c.name])), [companies])
  const companyInfoMap = useMemo(
    () => new Map(companies.map(c => [c.id, { name: c.name, address: c.address || '', taxCode: c.taxCode || '' }])),
    [companies]
  )
  const manufacturerMap = useMemo(() => new Map(manufacturers.map(m => [m.id, m.name])), [manufacturers])
  const countryMap = useMemo(() => new Map(countries.map(c => [c.id, c.name])), [countries])
  const departmentMap = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments])
  const unitMap = useMemo(() => new Map(units.map(u => [u.id, u.name])), [units])
  const itemCatalogUnitMap = useMemo(
    () => new Map(itemCatalogs.map(ic => [ic.id, ic.unitCatalogId])),
    [itemCatalogs]
  )

  const companyOptions = useMemo(() => companies.map(c => ({ value: c.id, label: c.name })), [companies])
  const manufacturerOptions = useMemo(() => manufacturers.map(m => ({ value: m.id, label: m.name })), [manufacturers])
  const countryOptions = useMemo(() => countries.map(c => ({ value: c.id, label: c.name })), [countries])
  const departmentOptions = useMemo(() => departments.map(d => ({ value: d.id, label: d.name })), [departments])
  const deviceTypeOptions = useMemo(() => deviceTypes.map(dt => ({ value: dt.id, label: dt.name })), [deviceTypes])
  const deviceStatusOptions = useMemo(() => deviceStatuses.map(s => ({ value: s.id, label: s.name })), [deviceStatuses])
  const unitOptions = useMemo(() => units.map(u => ({ value: u.id, label: u.name })), [units])

  return {
    companies, manufacturers, countries, departments, deviceTypes, deviceStatuses, units, itemCatalogs,
    companyMap, companyInfoMap, manufacturerMap, countryMap, departmentMap, unitMap, itemCatalogUnitMap,
    companyOptions, manufacturerOptions, countryOptions, departmentOptions,
    deviceTypeOptions, deviceStatusOptions, unitOptions
  }
}
