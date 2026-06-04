import {createRoot} from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import App from './App.tsx';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <ToastContainer position="top-right" autoClose={2500} theme="colored" />
  </>,
);
