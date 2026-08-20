import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// 렌더링 중(또는 생명주기 메서드에서) 발생한 오류를 잡아 흰 화면 대신
// 복구 UI를 보여줘요. 이벤트 핸들러나 setTimeout/Promise 안에서 던진
// 오류는 React가 구조적으로 못 잡기 때문에, 그런 지점(예: playSound)은
// 각자 try/catch로 따로 방어해야 해요.
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[ErrorBoundary] 처리되지 않은 렌더링 오류예요:",
      error,
      info.componentStack,
    );
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error == null) {
      return this.props.children;
    }
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          minHeight: "100dvh",
          padding: 24,
          textAlign: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#374151",
        }}
      >
        <div style={{ fontSize: 40 }} aria-hidden="true">
          😵
        </div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          일시적인 문제가 발생했어요
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "#6B7280" }}>
          잠시 후 다시 시도해주세요.
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          style={{
            marginTop: 8,
            padding: "10px 20px",
            borderRadius: 999,
            border: "none",
            background: "#5B8DEF",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          다시 시도하기
        </button>
      </div>
    );
  }
}
