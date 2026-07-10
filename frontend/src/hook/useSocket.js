import { useEffect, useRef } from 'react';
import { socket } from '../socket';

/**
 * useSocket — subscribe to a socket event inside any React component.
 *
 * Automatically removes the listener on unmount so you never get memory
 * leaks or stale closures from components that have been unmounted.
 *
 * Usage:
 *   useSocket('new_notification', (data) => {
 *     setNotifications(prev => [data, ...prev]);
 *     setUnreadCount(prev => prev + 1);
 *   });
 *
 * @param {string}   event    - Socket event name to listen for
 * @param {Function} handler  - Callback receiving the event payload
 */
const useSocket = (event, handler) => {
  // Keep a stable ref to the handler so we don't re-register on every render
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
};

export default useSocket;