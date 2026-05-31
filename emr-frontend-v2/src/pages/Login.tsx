import React from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { login, persistAuthSession } from '../services/auth'
import { useNavigate } from 'react-router-dom'

function getLoginErrorMessage(error?: unknown, fallback?: string) {
  const raw = String((error as any)?.message || fallback || '').trim()
  const normalized = raw.toLowerCase()

  if (
    normalized.includes('invalid credentials')
    || normalized.includes('authentication failed')
    || normalized.includes('unauthorized')
  ) {
    return 'Tên đăng nhập hoặc mật khẩu không đúng'
  }

  if (normalized.includes('inactive')) {
    return 'Tài khoản đã bị khóa hoặc chưa được kích hoạt'
  }

  if (
    normalized.includes('username and password are required')
    || normalized.includes('invalid request')
  ) {
    return 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
  }

  if (raw) return raw
  return 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin'
}

export default function Login(): JSX.Element{
  const [form] = Form.useForm()
  const nav = useNavigate()

  const onFinish = async (vals:any)=>{
    try{
      const res = await login({ username: vals.username, password: vals.password })
      if(res.success && res.data){
        // store token if present
        const token = (res.data as any).token || (res.data as any).accessToken
        persistAuthSession({
          token,
          username: (res.data as any).username || vals.username,
          role: (res.data as any).role || null,
          departmentId: (res.data as any).departmentId ?? null
        })
        message.success('Đăng nhập thành công')
        nav('/')
      }else{
        message.error(getLoginErrorMessage(undefined, res.message))
      }
    }catch(e){
      console.error(e)
      message.error(getLoginErrorMessage(e))
    }
  }

  return (
    <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center'}}>
      <Card title="Đăng nhập" style={{width:360}}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="Tài khoản" rules={[{required:true, message: 'Vui lòng nhập tài khoản'}]}><Input/></Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{required:true, message: 'Vui lòng nhập mật khẩu'}]}><Input.Password/></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>Đăng nhập</Button></Form.Item>
        </Form>
      </Card>
    </div>
  )
}

