import { Navigate } from 'react-router-dom';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';
import { getProductLaunchState } from '../utils/productExperience';

function InternalProductRoute({ productId, children }) {
  const { loadingSession, user } = useFounderWorkspace();

  if (loadingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-cream px-6 text-brand-black">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-black/55">
          Checking tool access...
        </p>
      </main>
    );
  }

  const launchState = getProductLaunchState({ id: productId }, user?.email);

  if (launchState.canAccess) {
    return children;
  }

  return <Navigate to={`/products/${productId}`} replace />;
}

export default InternalProductRoute;
