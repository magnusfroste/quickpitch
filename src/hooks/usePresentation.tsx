import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePresentation = (channelName: string | undefined, currentUserId: string | null) => {
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationImages, setPresentationImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const presenceChannel = useRef<any>(null);
  const [sharedState, setSharedState] = useState<{
    isPresentationMode: boolean;
    currentImageIndex: number;
    presenterUserId?: string;
  }>({
    isPresentationMode: false,
    currentImageIndex: 0
  });

  useEffect(() => {
    if (!channelName) return;

    const initializePresenceChannel = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const channelId = `room:${channelName}`;
      presenceChannel.current = supabase.channel(channelId, {
        config: {
          presence: {
            key: user?.id,
          },
        },
      });

      presenceChannel.current
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.current.presenceState();
          console.log("Presence state updated:", state);
          
          const presenterState = Object.values(state).find((presences: any) => 
            presences.some((presence: any) => presence.isPresentationMode)
          );
          
          if (presenterState) {
            const presenter = presenterState[0];
            setSharedState({
              isPresentationMode: presenter.isPresentationMode,
              currentImageIndex: presenter.currentImageIndex,
              presenterUserId: presenter.userId
            });
            setIsPresentationMode(presenter.isPresentationMode);
            setCurrentImageIndex(presenter.currentImageIndex);
          } else {
            setSharedState({
              isPresentationMode: false,
              currentImageIndex: 0,
              presenterUserId: undefined
            });
            setIsPresentationMode(false);
            setCurrentImageIndex(0);
          }
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            const { data: { user } } = await supabase.auth.getUser();
            await presenceChannel.current.track({
              isPresentationMode: false,
              currentImageIndex: 0,
              userId: user?.id
            });
          }
        });
    };

    initializePresenceChannel();
    fetchPresentationImages();

    return () => {
      if (presenceChannel.current) {
        presenceChannel.current.untrack();
        supabase.removeChannel(presenceChannel.current);
      }
    };
  }, [channelName]);

  const fetchPresentationImages = async () => {
    console.log('Fetching presentation images...');
    const { data, error } = await supabase
      .from('presentation_images')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching presentation images:', error);
      toast.error('Failed to fetch presentation images');
      return;
    }

    console.log('Fetched presentation images:', data);
    setPresentationImages(data || []);
  };

  const togglePresentation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const newPresentationMode = !isPresentationMode;
    
    console.log("Toggling presentation mode:", newPresentationMode);
    
    if (presenceChannel.current) {
      console.log("Tracking new presentation state:", {
        isPresentationMode: newPresentationMode,
        currentImageIndex,
        userId: user?.id
      });
      
      await presenceChannel.current.track({
        isPresentationMode: newPresentationMode,
        currentImageIndex,
        userId: user?.id
      });
    }
    
    setIsPresentationMode(newPresentationMode);
    toast.success(newPresentationMode ? 'Presentation started' : 'Presentation ended');
  };

  const nextImage = async () => {
    if (currentImageIndex < presentationImages.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (presenceChannel.current) {
        await presenceChannel.current.track({
          isPresentationMode: true,
          currentImageIndex: newIndex,
          userId: user?.id
        });
      }
    }
  };

  const previousImage = async () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (presenceChannel.current) {
        await presenceChannel.current.track({
          isPresentationMode: true,
          currentImageIndex: newIndex,
          userId: user?.id
        });
      }
    }
  };

  return {
    isPresentationMode,
    presentationImages,
    currentImageIndex,
    sharedState,
    togglePresentation,
    nextImage,
    previousImage
  };
};