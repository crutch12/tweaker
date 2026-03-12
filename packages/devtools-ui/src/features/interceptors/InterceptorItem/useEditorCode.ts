import { useCallback, useEffect, useEffectEvent, useState } from "react";

export interface UseExpressionCodeProps {
  initialCode: string | undefined;
  code: string | undefined;
  onCodeChange: (value: string | undefined) => void;
}

export function useEditorCode({
  initialCode: _initialCode,
  code,
  onCodeChange,
}: UseExpressionCodeProps) {
  const [initialCode, setInitialCode] = useState(() => _initialCode);

  const [updatesCount, setUpdatesCount] = useState(0);

  const resetCode = useEffectEvent((force: boolean) => {
    if (force || _initialCode !== code) {
      setUpdatesCount((v) => v + 1);
      setInitialCode(_initialCode);
      onCodeChange(_initialCode);
    }
  });

  useEffect(() => {
    resetCode(false); // FIXME: with false works incorrectly
  }, [_initialCode]);

  const discardChanges = useCallback(() => {
    resetCode(true);
  }, []);

  return {
    initialCode,
    updatesCount,
    discardChanges,
  };
}
