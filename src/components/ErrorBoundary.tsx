import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  error?: any
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false
    }
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white' }}>
          <h2>Đã xảy ra lỗi.</h2>

          <pre>
            {String(this.state.error)}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}