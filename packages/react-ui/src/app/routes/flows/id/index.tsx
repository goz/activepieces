import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router-dom';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/builder-state-provider';
import { LoadingSpinner } from '@/components/ui/spinner';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PopulatedFlow } from '@activepieces/shared';
import { sampleDataHooks } from '@/features/flows/lib/sample-data-hooks';

const FlowBuilderPage = () => {
  const { flowId } = useParams();

  const {
    data: flow,
    isLoading,
    isError,
  } = useQuery<PopulatedFlow, Error>({
    queryKey: ['flow', flowId],
    queryFn: () => flowsApi.get(flowId!),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: sampleData, isLoading: isSampleDataLoading, isError: isSampleDataError } = sampleDataHooks.useSampleDataForFlow(flow?.version)

  if (isError) {
    return <Navigate to="/404" />;
  }

  if (isSampleDataError) {
    return <>
      <p>
        Error loading sample data, contact support
      </p>
    </>
  }

  if (isLoading || isSampleDataLoading) {
    return (
      <div className="bg-background flex h-screen w-screen items-center justify-center ">
        <LoadingSpinner size={50}></LoadingSpinner>
      </div>
    );
  }

  return (
    <BuilderStateProvider
      flow={flow!}
      canExitRun={true}
      flowVersion={flow!.version}
      readonly={false}
      run={null}
      sampleData={sampleData ?? {}}
    >
      <BuilderPage />
    </BuilderStateProvider>
  );
};

export { FlowBuilderPage };
