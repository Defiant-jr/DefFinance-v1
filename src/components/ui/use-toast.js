import * as React from 'react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000;

const toastTimeouts = new Map();

let currentState = { toasts: [] };

const listeners = new Set();

const addToRemoveQueue = (toastId) => {
	if (toastTimeouts.has(toastId)) {
		return;
	}

	const timeout = setTimeout(() => {
		toastTimeouts.delete(toastId);
		dispatch({ type: 'REMOVE_TOAST', toastId });
	}, TOAST_REMOVE_DELAY);

	toastTimeouts.set(toastId, timeout);
};

const dispatch = (action) => {
	currentState = reducer(currentState, action);
	listeners.forEach((listener) => listener(currentState));
};

const reducer = (state, action) => {
	switch (action.type) {
		case 'ADD_TOAST':
			return {
				...state,
				toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
			};
		case 'UPDATE_TOAST':
			return {
				...state,
				toasts: state.toasts.map((toast) =>
					toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
				),
			};
		case 'DISMISS_TOAST': {
			const { toastId } = action;

			if (toastId) {
				addToRemoveQueue(toastId);
			} else {
				state.toasts.forEach((toast) => addToRemoveQueue(toast.id));
			}

			return {
				...state,
				toasts: state.toasts.map((toast) =>
					toast.id === toastId ? { ...toast, open: false } : toast,
				),
			};
		}
		case 'REMOVE_TOAST':
			return {
				...state,
				toasts: action.toastId
					? state.toasts.filter((toast) => toast.id !== action.toastId)
					: [],
			};
		default:
			return state;
	}
};

const listenersSubscribe = (listener) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const genId = () => Math.random().toString(36).slice(2, 9);

export const toast = (props) => {
	const id = genId();

	const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });
	const update = (updatedProps) =>
		dispatch({ type: 'UPDATE_TOAST', toast: { ...updatedProps, id } });

	dispatch({
		type: 'ADD_TOAST',
		toast: {
			id,
			...props,
			open: true,
			dismiss,
			update,
		},
	});

	const duration = props.duration ?? 5000;
	if (duration !== Infinity) {
		setTimeout(() => dismiss(), duration);
	}

	return { id };
};

export function useToast() {
	const [state, setState] = React.useState(currentState);

	React.useEffect(() => listenersSubscribe(setState), []);

	return {
		toasts: state.toasts,
		toast,
	};
}
