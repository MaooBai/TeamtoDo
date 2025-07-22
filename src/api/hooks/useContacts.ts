import { useMemo } from 'react';
import { useDeptTree, useUsers } from './useAuth';
import {
  transformToContactsStructure,
  flattenContacts,
  groupContactsByLetter,
  searchContacts
} from '../utils/contactsUtils';
import { Contact, ContactDept } from '../types/auth';

/**
 * 通讯录数据处理Hook
 * @param searchText 搜索文本
 * @returns 处理后的通讯录数据
 */
export function useContacts(searchText: string = '') {
  const getDeptTreeData = useDeptTree();
  const getUsersData = useUsers();

  // 处理通讯录数据
  const contactsData = useMemo(() => {
    if (!getDeptTreeData.data?.depts || !getUsersData.data?.data) {
      return {
        departments: [] as ContactDept[],
        allContacts: [] as Contact[],
        sections: [],
        isLoading: getDeptTreeData.isPending || getUsersData.isPending,
        error: getDeptTreeData.error || getUsersData.error
      };
    }

    try {
      // 转换为通讯录结构
      const departments = transformToContactsStructure(
        getDeptTreeData.data.depts,
        getUsersData.data.data
      );

      // 获取所有联系人
      const allContacts = flattenContacts(departments);

      // 搜索过滤
      const filteredContacts = searchContacts(allContacts, searchText);

      // 按字母分组
      const sections = groupContactsByLetter(filteredContacts);

      return {
        departments,
        allContacts: filteredContacts,
        sections,
        isLoading: false,
        error: null
      };
    } catch (error) {
      console.error('处理通讯录数据时出错:', error);
      return {
        departments: [] as ContactDept[],
        allContacts: [] as Contact[],
        sections: [],
        isLoading: false,
        error: error as Error
      };
    }
  }, [getDeptTreeData.data, getUsersData.data, searchText]);

  // 数据获取方法
  const refetch = () => {
    if (!getDeptTreeData.data && !getDeptTreeData.isPending) {
      getDeptTreeData.mutate();
    }
    if (!getUsersData.data && !getUsersData.isPending) {
      getUsersData.mutate();
    }
  };

  return {
    ...contactsData,
    refetch,
    isLoading: getDeptTreeData.isPending || getUsersData.isPending,
    error: getDeptTreeData.error || getUsersData.error
  };
}

/**
 * 获取部门统计信息
 * @param departments 部门数组
 * @returns 统计信息
 */
export function useDepartmentStats(departments: ContactDept[]) {
  return useMemo(() => {
    let totalContacts = 0;
    let totalDepartments = 0;

    function countStats(depts: ContactDept[]) {
      depts.forEach(dept => {
        totalDepartments++;
        totalContacts += dept.contacts.length;
        if (dept.children) {
          countStats(dept.children);
        }
      });
    }

    countStats(departments);

    return {
      totalContacts,
      totalDepartments
    };
  }, [departments]);
}

/**
 * 根据部门ID查找联系人
 * @param deptId 部门ID
 * @param departments 部门数组
 * @returns 该部门及其子部门的所有联系人
 */
export function useContactsByDepartment(deptId: number, departments: ContactDept[]) {
  return useMemo(() => {
    function findDeptContacts(depts: ContactDept[], targetId: number): Contact[] {
      for (const dept of depts) {
        if (dept.id === targetId) {
          const allContacts = [...dept.contacts];
          if (dept.children) {
            dept.children.forEach(child => {
              allContacts.push(...flattenContacts([child]));
            });
          }
          return allContacts;
        }
        if (dept.children) {
          const result = findDeptContacts(dept.children, targetId);
          if (result.length > 0) {
            return result;
          }
        }
      }
      return [];
    }

    return findDeptContacts(departments, deptId);
  }, [deptId, departments]);
}