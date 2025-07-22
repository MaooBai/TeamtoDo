import { DeptTreeDataSchema, UsersataSchema, ContactDept, Contact } from '../types/auth';
import { z } from 'zod';

// 部门树数据类型
type DeptTreeData = z.infer<typeof DeptTreeDataSchema>;
// 用户数据类型
type UserData = z.infer<typeof UsersataSchema>;

/**
 * 将用户数据转换为联系人格式
 * @param user 用户数据
 * @param deptName 部门名称
 * @returns 联系人数据
 */
function transformUserToContact(user: UserData, deptName: string): Contact {
  return {
    id: user.userId,
    name: user.nickName,
    phone: user.phonenumber,
    email: user.email,
    avatar: user.avatar,
    deptId: user.deptId,
    deptName: deptName,
    position: undefined // 可以根据需要添加职位信息
  };
}

/**
 * 递归构建通讯录部门结构
 * @param deptTree 部门树节点
 * @param allUsers 所有用户数据
 * @returns 通讯录部门结构
 */
function buildContactDept(deptTree: DeptTreeData, allUsers: UserData[]): ContactDept {
  // 获取当前部门的用户
  const deptUsers = allUsers.filter(user => user.deptId === deptTree.id);
  
  // 转换用户为联系人格式
  const contacts = deptUsers.map(user => transformUserToContact(user, deptTree.label));
  
  // 递归处理子部门
  const children = deptTree.children?.map(childDept => buildContactDept(childDept, allUsers));
  
  return {
    id: deptTree.id,
    name: deptTree.label,
    contacts: contacts,
    children: children
  };
}

/**
 * 将部门树和用户列表转换为通讯录结构
 * @param deptTrees 部门树数组
 * @param users 用户列表
 * @returns 通讯录部门结构数组
 */
export function transformToContactsStructure(
  deptTrees: DeptTreeData[],
  users: UserData[]
): ContactDept[] {
  return deptTrees.map(deptTree => buildContactDept(deptTree, users));
}

/**
 * 扁平化通讯录结构，获取所有联系人
 * @param contactDepts 通讯录部门结构数组
 * @returns 所有联系人的扁平化数组
 */
export function flattenContacts(contactDepts: ContactDept[]): Contact[] {
  const allContacts: Contact[] = [];
  
  function collectContacts(dept: ContactDept) {
    // 添加当前部门的联系人
    allContacts.push(...dept.contacts);
    
    // 递归处理子部门
    if (dept.children) {
      dept.children.forEach(childDept => collectContacts(childDept));
    }
  }
  
  contactDepts.forEach(dept => collectContacts(dept));
  return allContacts;
}

/**
 * 按姓名首字母分组联系人
 * @param contacts 联系人数组
 * @returns 按字母分组的联系人
 */
export function groupContactsByLetter(contacts: Contact[]) {
  const grouped: { [key: string]: Contact[] } = {};
  
  contacts.forEach(contact => {
    const firstLetter = contact.name[0]?.toUpperCase() || '#';
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(contact);
  });
  
  return Object.keys(grouped).sort().map(letter => ({
    title: letter,
    data: grouped[letter]
  }));
}

/**
 * 搜索联系人
 * @param contacts 联系人数组
 * @param searchText 搜索文本
 * @returns 匹配的联系人数组
 */
export function searchContacts(contacts: Contact[], searchText: string): Contact[] {
  if (!searchText.trim()) {
    return contacts;
  }
  
  const searchLower = searchText.toLowerCase();
  return contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchLower) ||
    contact.phone.includes(searchText) ||
    contact.email.toLowerCase().includes(searchLower) ||
    contact.deptName.toLowerCase().includes(searchLower)
  );
}

/**
 * 根据部门ID获取部门路径
 * @param deptId 部门ID
 * @param contactDepts 通讯录部门结构数组
 * @returns 部门路径字符串
 */
export function getDeptPath(deptId: number, contactDepts: ContactDept[]): string {
  function findDeptPath(depts: ContactDept[], targetId: number, currentPath: string[] = []): string[] | null {
    for (const dept of depts) {
      const newPath = [...currentPath, dept.name];
      
      if (dept.id === targetId) {
        return newPath;
      }
      
      if (dept.children) {
        const result = findDeptPath(dept.children, targetId, newPath);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }
  
  const path = findDeptPath(contactDepts, deptId);
  return path ? path.join(' > ') : '未知部门';
}