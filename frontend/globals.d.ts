declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

interface Window {
  SP_REACT: {
    createElement: Function;
    Fragment: any;
    [key: string]: any;
  };
  MainWindowBrowserManager?: {
    m_lastLocation?: {
      pathname: string;
    };
  };
}

declare const Millennium: {
  AddWindowCreateHook?: (callback: (context: object) => void | (() => void)) => void;
  [key: string]: any;
};
