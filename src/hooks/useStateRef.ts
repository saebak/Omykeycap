import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

// useState + useRef를 함께 묶어서 항상 동기화된 상태로 유지해줘요.
// 이벤트 핸들러나 타이머 콜백처럼 "다음 렌더를 기다릴 수 없는" 곳에서
// 최신 값을 동기적으로 읽어야 할 때(예: 연속 탭 처리, 콤보 계산) 사용해요.
//
// setValue를 통해 갱신하면 ref.current가 리렌더를 기다리지 않고 즉시
// 최신 값으로 바뀌어요. 함수형 업데이터를 넘기면 ref.current를 prev로
// 사용하므로, 같은 틱 안에서 여러 번 호출해도 항상 최신 값을 기준으로
// 계산돼요.
export function useStateRef<T>(
  initial: T | (() => T),
): [T, MutableRefObject<T>, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const ref = useRef(state);

  const setValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const resolved =
      typeof next === "function"
        ? (next as (prev: T) => T)(ref.current)
        : next;
    ref.current = resolved;
    setState(resolved);
  }, []);

  return [state, ref, setValue];
}
