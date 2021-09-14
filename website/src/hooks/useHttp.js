import { useState, useCallback } from "react";
import { http } from "@crypto-signals/utils";

const initialState = {
  isLoading: false,
  hasError: false,
  data: undefined,
  headers: undefined
};

const useHttp = transformResponse => {
  const defaultTransformFunction = useCallback(v => v, []);
  const [state, setState] = useState(initialState);
  const transform =
    typeof transformResponse === "function"
      ? transformResponse
      : defaultTransformFunction;
  const get = useCallback(
    async (...args) => {
      let hasError = false;
      let responseData;
      let responseHeaders;
      try {
        setState(prevState => ({
          ...prevState,
          hasError: false,
          isLoading: true
        }));
        const { data, headers } = await http.get(...args);
        responseData = data;
        responseHeaders = headers;
      } catch (error) {
        console.error(error);
        hasError = true;
      } finally {
        setState(prevState => ({
          ...prevState,
          isLoading: false,
          hasError,
          data: transform(responseData),
          headers: responseHeaders
        }));
      }
    },
    [transform]
  );

  return { ...state, get };
};

export default useHttp;
