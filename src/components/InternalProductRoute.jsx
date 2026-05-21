import { Navigate } from 'react-router-dom';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';
import { getProductLaunchState } from '../utils/productExperience';

function InternalProductRoute({ productId, children }) {
  const { user } = useFounderWorkspace();
  const launchState = getProductLaunchState({ id: productId }, user?.email);

  if (launchState.canAccess) {
    return children;
  }

  return <Navigate to={`/products/${productId}`} replace />;
}

export default InternalProductRoute;
