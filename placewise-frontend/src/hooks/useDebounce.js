import { useState, useEffect } from 'react'

/**
 * useDebounce — delays updating the returned value until `delay` ms have
 * passed since the last change to `value`. Useful for search inputs to
 * prevent a network request on every keystroke.
 *
 * @param {any}    value  The value to debounce.
 * @param {number} delay  Delay in milliseconds (default 350 ms).
 * @returns {any} The debounced value.
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 400)
 * useEffect(() => {
 *   if (debouncedSearch) fetchJobs(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce