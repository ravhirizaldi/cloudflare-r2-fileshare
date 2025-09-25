import {
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  CodeBracketIcon,
  PresentationChartLineIcon,
  TableCellsIcon,
  DocumentIcon,
  CpuChipIcon,
  CommandLineIcon,
  BookOpenIcon,
} from '@heroicons/vue/24/outline'

export function useFileIcon() {
  const getFileIcon = (mimeType, fileName = '') => {
    if (!mimeType) {
      // Fallback to file extension if no mime type
      const ext = fileName.split('.').pop()?.toLowerCase()
      return getIconByExtension(ext)
    }

    const type = mimeType.toLowerCase()

    // Images
    if (type.startsWith('image/')) {
      return PhotoIcon
    }

    // Videos
    if (type.startsWith('video/')) {
      return VideoCameraIcon
    }

    // Audio
    if (type.startsWith('audio/')) {
      return MusicalNoteIcon
    }

    // Documents
    if (
      type.includes('pdf') ||
      type.includes('msword') ||
      type.includes('wordprocessingml') ||
      type.includes('opendocument.text')
    ) {
      return DocumentTextIcon
    }

    // Spreadsheets
    if (
      type.includes('spreadsheetml') ||
      type.includes('ms-excel') ||
      type.includes('opendocument.spreadsheet') ||
      type.includes('csv')
    ) {
      return TableCellsIcon
    }

    // Presentations
    if (
      type.includes('presentationml') ||
      type.includes('ms-powerpoint') ||
      type.includes('opendocument.presentation')
    ) {
      return PresentationChartLineIcon
    }

    // Archives
    if (
      type.includes('zip') ||
      type.includes('rar') ||
      type.includes('tar') ||
      type.includes('gzip') ||
      type.includes('7z')
    ) {
      return ArchiveBoxIcon
    }

    // Code files
    if (
      type.includes('javascript') ||
      type.includes('json') ||
      type.includes('xml') ||
      type.includes('html') ||
      type.includes('css') ||
      type.includes('plain') // text/plain for many code files
    ) {
      return CodeBracketIcon
    }

    // Executables
    if (type.includes('application/x-') || type.includes('executable')) {
      return CpuChipIcon
    }

    // Default document icon
    return DocumentIcon
  }

  const getIconByExtension = (extension) => {
    if (!extension) return DocumentIcon

    const ext = extension.toLowerCase()

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return PhotoIcon
    }

    // Videos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
      return VideoCameraIcon
    }

    // Audio
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext)) {
      return MusicalNoteIcon
    }

    // Documents
    if (['pdf', 'doc', 'docx', 'odt', 'rtf'].includes(ext)) {
      return DocumentTextIcon
    }

    // Spreadsheets
    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
      return TableCellsIcon
    }

    // Presentations
    if (['ppt', 'pptx', 'odp'].includes(ext)) {
      return PresentationChartLineIcon
    }

    // Archives
    if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2'].includes(ext)) {
      return ArchiveBoxIcon
    }

    // Code files
    if (
      [
        'js',
        'ts',
        'html',
        'css',
        'json',
        'xml',
        'py',
        'java',
        'cpp',
        'c',
        'php',
        'rb',
        'go',
        'rs',
        'vue',
        'jsx',
        'tsx',
        'sql',
      ].includes(ext)
    ) {
      return CodeBracketIcon
    }

    // Executables
    if (['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'app'].includes(ext)) {
      return CpuChipIcon
    }

    // Text files
    if (['txt', 'md', 'readme'].includes(ext)) {
      return BookOpenIcon
    }

    // Shell scripts
    if (['sh', 'bat', 'cmd', 'ps1'].includes(ext)) {
      return CommandLineIcon
    }

    // Default
    return DocumentIcon
  }

  const getIconColor = (mimeType) => {
    if (!mimeType) return 'text-gray-400'

    const type = mimeType.toLowerCase()

    if (type.startsWith('image/')) return 'text-green-500'
    if (type.startsWith('video/')) return 'text-red-500'
    if (type.startsWith('audio/')) return 'text-purple-500'
    if (type.includes('pdf')) return 'text-red-600'
    if (type.includes('msword') || type.includes('wordprocessingml')) return 'text-blue-600'
    if (type.includes('spreadsheetml') || type.includes('ms-excel')) return 'text-green-600'
    if (type.includes('presentationml') || type.includes('ms-powerpoint')) return 'text-orange-500'
    if (type.includes('zip') || type.includes('rar') || type.includes('tar'))
      return 'text-yellow-600'
    if (type.includes('javascript') || type.includes('json') || type.includes('html'))
      return 'text-indigo-500'

    return 'text-gray-400'
  }

  return {
    getFileIcon,
    getIconColor,
  }
}
