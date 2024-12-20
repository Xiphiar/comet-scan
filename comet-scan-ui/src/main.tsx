import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import 'bootstrap/dist/css/bootstrap-grid.min.css';
import 'bootstrap/dist/css/bootstrap-utilities.min.css';
import './index.css'

import MainLayout from './layouts/mainLayout.tsx';
import ErrorPage from './pages/Error.tsx';
import OverviewPage from './pages/Overview/OverviewPage.tsx';
import SingleValidatorPage from './pages/Validators/SingleValidatorPage.tsx';
import ValidatorsListPage from './pages/Validators/ValidatorsListPage.tsx';
import SingleBlockPage from './pages/Block/SingleBlockPage.tsx';
import SingleTransactionPage from './pages/Transaction/SingleTransactionPage.tsx';
import RecentTransactionsPage from './pages/Transaction/RecentTransactionsPage.tsx';
import RecentBlocksPage from './pages/Block/RecentBlocksPage.tsx';
import AllProposalsPage from './pages/Proposals/AllProposalsPage.tsx';
import SingleProposalPage from './pages/Proposals/SingleProposalPage.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: ':chain',
        element: <OverviewPage />,
      },
      {
        path: ':chain/blocks',
        element: <RecentBlocksPage />,
      },
      {
        path: ':chain/blocks/:blockHeight',
        element: <SingleBlockPage />,
      },
      {
        path: ':chain/transactions',
        element: <RecentTransactionsPage />,
      },
      {
        path: ':chain/transactions/:transactionHash',
        element: <SingleTransactionPage />,
      },
      {
        path: ':chain/validators',
        element: <ValidatorsListPage />,
      },
      {
        path: ':chain/validators/:operatorAddress',
        element: <SingleValidatorPage />,
      },
      {
        path: ':chain/proposals',
        element: <AllProposalsPage />,
      },
      {
        path: ':chain/proposals/:proposalId',
        element: <SingleProposalPage />,
      }
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
