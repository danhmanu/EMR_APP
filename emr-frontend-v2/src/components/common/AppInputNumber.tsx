import React from 'react'
import { InputNumber as AntdInputNumber } from 'antd'

type AppInputNumberProps = React.ComponentProps<typeof AntdInputNumber>
type AppInputNumberRef = React.ElementRef<typeof AntdInputNumber>

const AppInputNumber = React.forwardRef<AppInputNumberRef, AppInputNumberProps>(function AppInputNumber(props, ref) {
  return <AntdInputNumber ref={ref} {...props} precision={props.precision ?? 2} />
})

AppInputNumber.displayName = 'AppInputNumber'

export default AppInputNumber