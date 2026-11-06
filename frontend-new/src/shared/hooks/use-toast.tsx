import { createContext, useContext, useReducer, ReactNode } from "react";

type Toast = {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "destructive";
};

type ToastState = {
  toasts: Toast[];
};

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string };

const initialState: ToastState = { toasts: [] };

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [action.toast, ...state.toasts] };
    case "REMOVE_TOAST":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

const ToastContext = createContext<{
  state: ToastState;
  dispatch: React.Dispatch<ToastAction>;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ToastContext.Provider value={{ state, dispatch }}>
      {children}
    </ToastContext.Provider>
  );
}

function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

export function useToast() {
  const { state, dispatch } = useToastContext();

  // Simulate mount for SSR
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toasts = state.toasts.slice(0, 5);

  return {
    ...state,
    toasts,
    dismiss: (id: string) => dispatch({ type: "REMOVE_TOAST", id }),
    toast: ({ ...props }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      dispatch({ type: "ADD_TOAST", toast: { ...props, id } });
      setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), 5000);
    },
  };
}