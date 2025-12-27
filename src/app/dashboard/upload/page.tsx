'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Video,
  Mic,
  Image as ImageIcon,
  FileText,
  X,
  Plus,
  Eye,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, CardContent, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

// Content Types
const CONTENT_TYPES = [
  { id: 'video', label: '동영상', icon: Video, accept: 'video/mp4,video/quicktime', maxSize: 500 },
  { id: 'audio', label: '오디오', icon: Mic, accept: 'audio/mp3,audio/wav,audio/mpeg', maxSize: 50 },
  { id: 'image', label: '이미지', icon: ImageIcon, accept: 'image/jpeg,image/png,image/gif,image/webp', maxSize: 10 },
  { id: 'document', label: '문서', icon: FileText, accept: 'application/pdf', maxSize: 20 },
] as const;

type ContentType = typeof CONTENT_TYPES[number]['id'];

// Access Levels
const ACCESS_LEVELS = [
  { id: 'public', label: '공개', description: '누구나 무료로 볼 수 있어요', icon: Eye },
  { id: 'paid', label: '유료', description: '콘텐츠를 개별 판매해요', icon: CreditCard },
] as const;

type AccessLevel = typeof ACCESS_LEVELS[number]['id'];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [contentType, setContentType] = useState<ContentType>('video');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('public');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get current content type config
  const currentTypeConfig = CONTENT_TYPES.find(t => t.id === contentType)!;

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const maxSizeMB = currentTypeConfig.maxSize;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (selectedFile.size > maxSizeBytes) {
      setErrors(prev => ({
        ...prev,
        file: `파일 크기가 ${maxSizeMB}MB를 초과합니다.`
      }));
      return;
    }

    setFile(selectedFile);
    setErrors(prev => {
      const { file, ...rest } = prev;
      return rest;
    });
  }, [currentTypeConfig]);

  // Handle thumbnail selection
  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        thumbnail: '썸네일 크기는 5MB 이하여야 합니다.'
      }));
      return;
    }

    setThumbnail(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
    setErrors(prev => {
      const { thumbnail, ...rest } = prev;
      return rest;
    });
  }, []);

  // Handle tag addition
  const addTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && tags.length < 5 && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (title.length > 100) {
      newErrors.title = '제목은 100자 이하로 입력해주세요.';
    }

    if (description.length > 2000) {
      newErrors.description = '설명은 2000자 이하로 입력해주세요.';
    }

    if (!file) {
      newErrors.file = '파일을 선택해주세요.';
    }

    if (accessLevel === 'paid') {
      const priceNum = parseInt(price);
      if (!price || isNaN(priceNum)) {
        newErrors.price = '가격을 입력해주세요.';
      } else if (priceNum < 1000) {
        newErrors.price = '최소 가격은 1,000원입니다.';
      } else if (priceNum > 100000) {
        newErrors.price = '최대 가격은 100,000원입니다.';
      }
    }

    if (schedulePublish) {
      if (!publishDate) {
        newErrors.publishDate = '발행 날짜를 선택해주세요.';
      }
      if (!publishTime) {
        newErrors.publishTime = '발행 시간을 선택해주세요.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save (draft or publish)
  const handleSave = async (isDraft: boolean) => {
    if (!validateForm() && !isDraft) return;

    setIsSaving(true);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirectTo=/dashboard/upload');
        return;
      }

      // Simulate upload progress for demo
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // In a real implementation, you would:
      // 1. Upload file to Supabase Storage
      // 2. Upload thumbnail to Supabase Storage
      // 3. Save content metadata to database

      // For now, we'll save the content metadata with placeholder URLs
      let publishedAt = null;
      if (!isDraft && !schedulePublish) {
        publishedAt = new Date().toISOString();
      } else if (!isDraft && schedulePublish && publishDate && publishTime) {
        publishedAt = new Date(`${publishDate}T${publishTime}`).toISOString();
      }

      const contentData = {
        creator_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        content_type: contentType,
        content_url: file ? `placeholder://${file.name}` : null, // Placeholder
        thumbnail_url: thumbnail ? `placeholder://${thumbnail.name}` : null, // Placeholder
        access_level: accessLevel,
        required_tier_id: null,
        price: accessLevel === 'paid' ? parseInt(price) : null,
        tags: tags,
        is_published: !isDraft,
        published_at: publishedAt,
        content_data: {
          file_name: file?.name,
          file_size: file?.size,
          file_type: file?.type,
        },
      };

      const { error } = await supabase
        .from('contents')
        .insert(contentData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        console.error('Save error:', error);
        setErrors({ submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
        return;
      }

      // Redirect to contents page
      setTimeout(() => {
        router.push('/dashboard/contents');
      }, 500);
    } catch (error) {
      console.error('Save error:', error);
      setErrors({ submit: '저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">새 콘텐츠</h1>
                <p className="text-sm text-gray-500">콘텐츠를 업로드하고 팬들과 공유하세요</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={isSaving || !title.trim()}
              >
                임시저장
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadProgress}%
                  </>
                ) : (
                  '발행하기'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Content Type Selection */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">콘텐츠 유형</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CONTENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = contentType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setContentType(type.id);
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                      isSelected
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      isSelected ? 'bg-gray-500' : 'bg-gray-100'
                    )}>
                      <Icon className={cn('w-6 h-6', isSelected ? 'text-white' : 'text-gray-500')} />
                    </div>
                    <span className={cn(
                      'font-medium text-sm',
                      isSelected ? 'text-gray-700' : 'text-gray-700'
                    )}>
                      {type.label}
                    </span>
                    <span className="text-xs text-gray-400">최대 {type.maxSize}MB</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* File Upload */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">파일 업로드</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                errors.file
                  ? 'border-red-300 bg-red-50'
                  : file
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={currentTypeConfig.accept}
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-medium text-gray-900 mb-1">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-3 text-sm text-red-600 hover:text-red-700"
                  >
                    파일 제거
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-700 mb-1">
                    클릭하여 파일을 선택하세요
                  </p>
                  <p className="text-sm text-gray-500">
                    또는 파일을 여기에 드래그하세요
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    최대 {currentTypeConfig.maxSize}MB
                  </p>
                </div>
              )}
            </div>
            {errors.file && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.file}
              </p>
            )}
          </section>

          {/* Thumbnail (for video/audio) */}
          {(contentType === 'video' || contentType === 'audio') && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">썸네일 (선택)</h2>
              <div className="flex gap-4">
                <div
                  onClick={() => thumbnailInputRef.current?.click()}
                  className={cn(
                    'w-40 h-24 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all overflow-hidden',
                    thumbnailPreview
                      ? 'border-transparent'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                >
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs text-gray-500">이미지 추가</span>
                    </div>
                  )}
                </div>
                {thumbnailPreview && (
                  <button
                    onClick={() => {
                      setThumbnail(null);
                      setThumbnailPreview(null);
                      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    제거
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                16:9 비율 권장, 최대 5MB
              </p>
            </section>
          )}

          {/* Title & Description */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">콘텐츠 정보</h2>
            <div className="space-y-4">
              <Input
                label="제목"
                placeholder="콘텐츠 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                helperText={`${title.length}/100`}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  설명 (선택)
                </label>
                <textarea
                  placeholder="콘텐츠에 대한 설명을 입력하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={cn(
                    'w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400',
                    'transition-all duration-200 resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900',
                    errors.description ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                <div className="flex justify-between mt-1.5">
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">{description.length}/2000</p>
                </div>
              </div>
            </div>
          </section>

          {/* Tags */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">태그 (선택)</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 py-1.5 px-3">
                  #{tag}
                  <button onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="태그를 입력하세요"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={tags.length >= 5}
              />
              <Button
                variant="outline"
                onClick={addTag}
                disabled={tags.length >= 5 || !tagInput.trim()}
              >
                추가
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">최대 5개까지 추가할 수 있어요</p>
          </section>

          {/* Access Level */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">공개 범위</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACCESS_LEVELS.map((level) => {
                const Icon = level.icon;
                const isSelected = accessLevel === level.id;

                return (
                  <button
                    key={level.id}
                    onClick={() => setAccessLevel(level.id)}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                      isSelected
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      isSelected ? 'bg-gray-500' : 'bg-gray-100'
                    )}>
                      <Icon className={cn('w-5 h-5', isSelected ? 'text-white' : 'text-gray-500')} />
                    </div>
                    <div>
                      <p className={cn(
                        'font-medium',
                        isSelected ? 'text-gray-700' : 'text-gray-900'
                      )}>
                        {level.label}
                      </p>
                      <p className="text-sm text-gray-500">{level.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-gray-900 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Price Input */}
            {accessLevel === 'paid' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  판매 가격
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="10000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    error={errors.price}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    원
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  최소 1,000원 ~ 최대 100,000원
                </p>
              </div>
            )}
          </section>

          {/* Schedule Publishing */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">예약 발행</h2>
              <button
                onClick={() => setSchedulePublish(!schedulePublish)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  schedulePublish ? 'bg-gray-500' : 'bg-gray-300'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
                  schedulePublish && 'translate-x-5'
                )} />
              </button>
            </div>

            {schedulePublish && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      날짜
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={cn(
                          'w-full pl-10 pr-4 py-3 border rounded-lg text-gray-900',
                          'focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900',
                          errors.publishDate ? 'border-red-300' : 'border-gray-200'
                        )}
                      />
                    </div>
                    {errors.publishDate && (
                      <p className="mt-1 text-sm text-red-500">{errors.publishDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      시간
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={publishTime}
                        onChange={(e) => setPublishTime(e.target.value)}
                        className={cn(
                          'w-full pl-10 pr-4 py-3 border rounded-lg text-gray-900',
                          'focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900',
                          errors.publishTime ? 'border-red-300' : 'border-gray-200'
                        )}
                      />
                    </div>
                    {errors.publishTime && (
                      <p className="mt-1 text-sm text-red-500">{errors.publishTime}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
