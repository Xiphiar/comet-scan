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
import ConfigProvider from './providers/ConfigProvider.tsx';
import MainPage from './pages/Main/MainPage.tsx';
import SingleAccountPage from './pages/Accounts/SingleAccountPage.tsx';
import AllContractsPage from './pages/Contracts/AllContractsPage.tsx';
import SingleContractPage from './pages/Contracts/SingleContractPage.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainPage />,
  },
  {
    path: '/:chain',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <OverviewPage />,
      },
      {
        path: 'blocks',
        element: <RecentBlocksPage />,
      },
      {
        path: 'blocks/:blockHeight',
        element: <SingleBlockPage />,
      },
      {
        path: 'transactions',
        element: <RecentTransactionsPage />,
      },
      {
        path: 'transactions/:transactionHash',
        element: <SingleTransactionPage />,
      },
      {
        path: 'validators',
        element: <ValidatorsListPage />,
      },
      {
        path: 'validators/inactive',
        element: <ValidatorsListPage inactive={true} />,
      },
      {
        path: 'validators/:operatorAddress',
        element: <SingleValidatorPage />,
      },
      {
        path: 'proposals',
        element: <AllProposalsPage />,
      },
      {
        path: 'proposals/:proposalId',
        element: <SingleProposalPage />,
      },
      {
        path: 'accounts',
        element: <div>TODO</div>,
      },
      {
        path: 'accounts/:accountAddress',
        element: <SingleAccountPage />,
      },
      {
        path: 'contracts',
        element: <AllContractsPage />,
      },
      {
        path: 'contracts/:contractAddress',
        element: <SingleContractPage />,
      }
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>,
)
