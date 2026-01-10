// Core Components
export { Button, type ButtonProps } from './Button';
export { Input, type InputProps } from './Input';
export { SearchInput, type SearchInputProps } from './SearchInput';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from './Card';
export { Avatar, type AvatarProps } from './Avatar';
export { Badge, type BadgeProps } from './Badge';
export { Spinner, LoadingPage, LoadingSection, LoadingInline, type SpinnerProps } from './Spinner';

// New Toss-style Components
export { Modal, ConfirmModal, type ModalProps } from './Modal';
export { BottomSheet, type BottomSheetProps } from './BottomSheet';
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsTriggerUnderline,
  TabsContent,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
} from './Tabs';
export {
  ToastProvider,
  useToast,
  useToastActions,
  type Toast,
  type ToastType,
  type ToastProviderProps,
} from './Toast';
export { Select, type SelectProps, type SelectOption } from './Select';
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonButton,
  type SkeletonProps,
} from './Skeleton';
export { Divider, type DividerProps } from './Divider';
export { PageLoader } from './PageLoader';
export { SchoolSearch } from './SchoolSearch';

// Motion Utilities
export * from './motion';
