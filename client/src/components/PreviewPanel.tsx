import { DownloadIcon, ImageIcon, Loader2Icon } from "lucide-react";
import {
  type AspectRatio,
  type IThumbnail,
} from "../assets/assets";

const PreviewPanel = ({
  thumbnail,
  isLoading,
  aspectRatio,
}: {
  thumbnail: IThumbnail | null;
  isLoading: boolean;
  aspectRatio: AspectRatio;
}) => {
  const aspectClasses = {
    "16:9": "aspect-video",
    "1:1": "aspect-square",
    "9:16": "aspect-[9/16]",
  } as Record<AspectRatio, string>;

  const onDownload = () => {
    if (!thumbnail?.image_url) return;

    const link = document.createElement("a");

    link.href = thumbnail.image_url.replace(
      "/upload",
      "/upload/fl_attachment"
    );

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="relative mx-auto w-full max-w-2xl rounded-xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
      {/* Preview Heading */}
      <h2 className="mb-5 text-lg font-semibold text-zinc-100">
        Preview
      </h2>

      {/* Preview Container */}
      <div
        className={`relative w-full overflow-hidden rounded-lg border-2 border-dashed border-white/20 bg-black/25 ${
          aspectClasses[aspectRatio]
        }`}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/25">
            <Loader2Icon className="size-8 animate-spin text-zinc-400" />

            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">
                AI is creating your thumbnail...
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                This may take 10-20 seconds
              </p>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {!isLoading && thumbnail?.image_url && (
          <div className="group relative h-full w-full">
            <img
              src={thumbnail.image_url}
              alt={thumbnail.title}
              className="h-full w-full object-cover"
            />

            {/* Download Overlay */}
            <div className="absolute inset-0 flex items-end justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={onDownload}
                type="button"
                className="mb-6 flex items-center gap-2 rounded-md bg-white/30 px-5 py-2.5 text-xs font-medium backdrop-blur transition hover:scale-105 active:scale-95"
              >
                <DownloadIcon className="size-4" />
                Download Thumbnail
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !thumbnail?.image_url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="flex size-20 items-center justify-center rounded-full bg-white/10">
              <ImageIcon className="size-10 text-white opacity-50" />
            </div>

            <div className="px-4 text-center">
              <p className="text-sm font-medium text-zinc-200">
                Generate your first thumbnail
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                Fill out the form and click Generate
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;