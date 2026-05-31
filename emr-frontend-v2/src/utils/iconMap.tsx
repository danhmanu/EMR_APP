import {
  HomeOutlined,
  AppstoreOutlined,
  ToolOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  SwapOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  ProfileOutlined,
  ScheduleOutlined,
  CheckSquareOutlined,
  AuditOutlined,
  ImportOutlined,
  ExportOutlined,
  FileDoneOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import React from 'react'

const iconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  ToolOutlined: <ToolOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  UserOutlined: <UserOutlined />,
  SettingOutlined: <SettingOutlined />,
  BellOutlined: <BellOutlined />,
  SwapOutlined: <SwapOutlined />,
  ShoppingCartOutlined: <ShoppingCartOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  UnorderedListOutlined: <UnorderedListOutlined />,
  ProfileOutlined: <ProfileOutlined />,
  ScheduleOutlined: <ScheduleOutlined />,
  CheckSquareOutlined: <CheckSquareOutlined />,
  AuditOutlined: <AuditOutlined />,
  ImportOutlined: <ImportOutlined />,
  ExportOutlined: <ExportOutlined />,
  FileDoneOutlined: <FileDoneOutlined />,
  GlobalOutlined: <GlobalOutlined />
}

export function getIconComponent(iconName?: string): React.ReactNode {
  if (!iconName || !iconMap[iconName]) {
    return null
  }
  return iconMap[iconName]
}
