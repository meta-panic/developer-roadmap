import { useMemo, useRef, useState } from 'preact/hooks';
import CloseIcon from '../../icons/close.svg';
import SpinnerIcon from '../../icons/spinner.svg';

import { useKeydown } from '../../hooks/use-keydown';
import { useLoadTopic } from '../../hooks/use-load-topic';
import { useOutsideClick } from '../../hooks/use-outside-click';
import { useToggleTopic } from '../../hooks/use-toggle-topic';
import { httpGet } from '../../lib/http';
import { isLoggedIn } from '../../lib/jwt';
import {
  isTopicDone,
  renderTopicProgress,
  ResourceType,
  updateResourceProgress as updateResourceProgressApi,
} from '../../lib/resource-progress';
import { pageLoadingMessage, sponsorHidden } from '../../stores/page';
import { TopicProgressButton } from './TopicProgressButton';

export function TopicDetail() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [topicHtml, setTopicHtml] = useState('');

  const isGuest = useMemo(() => !isLoggedIn(), []);
  const topicRef = useRef<HTMLDivElement>(null);

  // Details of the currently loaded topic
  const [topicId, setTopicId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('roadmap');

  const showLoginPopup = () => {
    const popupEl = document.querySelector(`#login-popup`);
    if (!popupEl) {
      return;
    }

    popupEl.classList.remove('hidden');
    popupEl.classList.add('flex');
    const focusEl = popupEl.querySelector<HTMLElement>('[autofocus]');
    if (focusEl) {
      focusEl.focus();
    }
  };


  // Close the topic detail when user clicks outside the topic detail
  useOutsideClick(topicRef, () => {
    setIsActive(false);
  });

  useKeydown('Escape', () => {
    setIsActive(false);
  });

  // Toggle topic is available even if the component UI is not active
  // This is used on the best practice screen where we have the checkboxes
  // to mark the topic as done/undone.
  useToggleTopic(({ topicId, resourceType, resourceId }) => {
    if (isGuest) {
      showLoginPopup();
      return;
    }

    pageLoadingMessage.set('Updating');

    // Toggle the topic status
    isTopicDone({ topicId, resourceId, resourceType })
      .then((oldIsDone) =>
        updateResourceProgressApi(
          {
            topicId,
            resourceId,
            resourceType,
          },
          oldIsDone ? 'pending' : 'done'
        )
      )
      .then(({ done = [] }) => {
        renderTopicProgress(
          topicId,
          done.includes(topicId) ? 'done' : 'pending'
        );
      })
      .catch((err) => {
        alert(err.message);
        console.error(err);
      })
      .finally(() => {
        pageLoadingMessage.set('');
      });
  });

  // Load the topic detail when the topic detail is active
  useLoadTopic(({ topicId, resourceType, resourceId }) => {
    setIsLoading(true);
    setIsActive(true);
    sponsorHidden.set(true);

    setTopicId(topicId);
    setResourceType(resourceType);
    setResourceId(resourceId);

    const topicPartial = topicId.replaceAll(':', '/');
    const topicUrl =
      resourceType === 'roadmap'
        ? `/${resourceId}/${topicPartial}`
        : `/best-practices/${resourceId}/${topicPartial}`;

    httpGet<string>(
      topicUrl,
      {},
      {
        headers: {
          Accept: 'text/html',
        },
      }
    )
      .then(({ response }) => {
        if (!response) {
          setError('Topic not found.');
          return;
        }

        // It's full HTML with page body, head etc.
        // We only need the inner HTML of the #main-content
        const node = new DOMParser().parseFromString(response, 'text/html');
        const topicHtml = node?.getElementById('main-content')?.outerHTML || '';

        setIsLoading(false);
        setTopicHtml(topicHtml);
      })
      .catch((err) => {
        setError('Something went wrong. Please try again later.');
        setIsLoading(false);
      });
  });

  if (!isActive) {
    return null;
  }

  const contributionDir =
    resourceType === 'roadmap' ? 'roadmaps' : 'best-practices';
  const contributionUrl = `https://github.com/kamranahmedse/developer-roadmap/tree/master/src/data/${contributionDir}/${resourceId}/content`;

  return (
    <div>
      <div
        ref={topicRef}
        className="fixed right-0 top-0 z-40 h-screen w-full overflow-y-auto bg-white p-4 sm:max-w-[600px] sm:p-6"
      >
        {isLoading && (
          <div className="flex w-full justify-center">
            <img
              src={SpinnerIcon}
              alt="Loading"
              className="h-6 w-6 animate-spin fill-blue-600 text-gray-200 sm:h-12 sm:w-12"
            />
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Actions for the topic */}
            <div className="mb-2">
              <TopicProgressButton
                topicId={topicId}
                resourceId={resourceId}
                resourceType={resourceType}
                onShowLoginPopup={showLoginPopup}
                onClose={() => {
                  setIsActive(false);
                }}
              />

              <button
                type="button"
                id="close-topic"
                className="absolute right-2.5 top-2.5 inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
                onClick={() => setIsActive(false)}
              >
                <img alt="Close" class="h-5 w-5" src={CloseIcon} />
              </button>
            </div>

            {/* Topic Content */}
            <div
              id="topic-content"
              className="prose prose-quoteless prose-h1:mb-2.5 prose-h1:mt-7 prose-h2:mb-3 prose-h2:mt-0 prose-h3:mb-[5px] prose-h3:mt-[10px] prose-p:mb-2 prose-p:mt-0 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-gray-700 prose-li:m-0 prose-li:mb-0.5"
              dangerouslySetInnerHTML={{ __html: topicHtml }}
            ></div>

            <p
              id="contrib-meta"
              class="mt-10 border-t pt-3 text-sm leading-relaxed text-gray-400"
            >
              Contribute links to learning resources about this topic{' '}
              <a
                target="_blank"
                class="text-blue-700 underline"
                href={contributionUrl}
              >
                on GitHub repository.
              </a>
              .
            </p>
          </>
        )}
      </div>
      <div class="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 dark:bg-opacity-80"></div>
    </div>
  );
}
