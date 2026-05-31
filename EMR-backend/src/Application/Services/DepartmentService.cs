using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EMR.Application.Interfaces;
using EMR.Domain.Entities;
using EMR.Domain.Exceptions;
using EMR.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EMR.Application.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IRepository<Department> _departmentRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DepartmentService(IRepository<Department> departmentRepository, IUnitOfWork unitOfWork)
        {
            _departmentRepository = departmentRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<Department>> GetAllAsync()
        {
            return await _departmentRepository.Query()
                .OrderBy(d => d.Name)
                .ToListAsync();
        }

        public async Task<Department> CreateAsync(Department model)
        {
            if (model == null)
                throw new ValidationException("Department payload is required.");
            if (string.IsNullOrWhiteSpace(model.Name))
                throw new ValidationException("Department name is required.");

            var code = string.IsNullOrWhiteSpace(model.Code) ? null : model.Code.Trim();
            var name = model.Name.Trim();

            if (code != null && await _departmentRepository.Query()
                .AnyAsync(d => !d.IsDeleted && d.Code != null && d.Code.ToLower() == code.ToLower()))
                throw new DuplicateException("Department code already exists.");

            if (await _departmentRepository.Query()
                .AnyAsync(d => !d.IsDeleted && d.Name != null && d.Name.ToLower() == name.ToLower()))
                throw new DuplicateException("Department name already exists.");

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                model.Code = code;
                model.Name = name;
                model.IsDeleted = false;
                await _departmentRepository.AddAsync(model);
                await _unitOfWork.CommitTransactionAsync();
                return model;
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<Department> UpdateAsync(int id, Department model)
        {
            if (model == null)
                throw new ValidationException("Department payload is required.");

            var department = await _departmentRepository.GetByIdAsync(id);
            if (department == null || department.IsDeleted)
                throw new EntityNotFoundException("Department", id);

            if (string.IsNullOrWhiteSpace(model.Name))
                throw new ValidationException("Department name is required.");

            var code = string.IsNullOrWhiteSpace(model.Code) ? null : model.Code.Trim();
            var name = model.Name.Trim();

            if (code != null && await _departmentRepository.Query()
                .AnyAsync(d => d.Id != id && !d.IsDeleted && d.Code != null && d.Code.ToLower() == code.ToLower()))
                throw new DuplicateException("Department code already exists.");

            if (await _departmentRepository.Query()
                .AnyAsync(d => d.Id != id && !d.IsDeleted && d.Name != null && d.Name.ToLower() == name.ToLower()))
                throw new DuplicateException("Department name already exists.");

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                department.Code = code;
                department.Name = name;
                await _departmentRepository.UpdateAsync(department);
                await _unitOfWork.CommitTransactionAsync();
                return department;
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task DeleteAsync(int id)
        {
            var department = await _departmentRepository.GetByIdAsync(id);
            if (department == null || department.IsDeleted)
                throw new EntityNotFoundException("Department", id);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                department.IsDeleted = true;
                await _departmentRepository.UpdateAsync(department);
                await _unitOfWork.CommitTransactionAsync();
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }
    }
}