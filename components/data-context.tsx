import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type Script = {
  // 구간 시작 시간
  start: number;
  // 구간 종료 시간
  end: number;
  // 변환된 텍스트 내용
  text: string;
};

export type Data = {
  // 식별 번호
  id: string;
  // 전체 녹음 텍스트
  text: string;
  // 시간별 스크립트
  scripts: Script[];
  // 요약 텍스트
  summary?: string;
};

type Database = {
  [id: string]: Data | undefined;
};

type ScriptContextType = {
  create: (data: Data) => void;
  get: ({ id }: { id: string }) => Data | undefined;
  update: ({ id, summary }: { id: string; summary?: string }) => void;
};

const ScriptContext = createContext<ScriptContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [database, setDatabase] = useState<Database>({});

  const create = useCallback((data: Data) => {
    setDatabase((prev) => ({
      ...prev,
      [data.id]: data,
    }));
  }, []);

  const get = useCallback(({ id }: { id: string }) => database[id], [database]);

  const update = useCallback(
    ({ id, summary }: { id: string; summary?: string }) => {
      setDatabase((prevDatabase) => {
        const prevData = prevDatabase[id];
        if (prevData == null) return prevDatabase;
        return {
          ...prevDatabase,
          [id]: {
            ...prevData,
            ...(summary != null ? { summary } : {}),
          },
        };
      });
    },
    []
  );

  return (
    <ScriptContext.Provider value={{ create, get, update }}>
      {children}
    </ScriptContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(ScriptContext);
  if (!context) throw new Error("useDatabase must to be within a DataProvider");
  return context;
};
