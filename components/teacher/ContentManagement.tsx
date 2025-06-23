'use client'

import { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Save,
  X,
  Tag,
  Globe,
  Volume2,
  BarChart3,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { 
  getAllContent,
  getAllCategories,
  createWord,
  updateWord,
  deleteWord,
  createCategory,
  updateCategory,
  deleteCategory,
  type ContentManagementItem
} from '@/lib/api/teacherManagement'
import { Category, Word } from '@/lib/types/learning'

interface WordFormData {
  id?: number
  category_id: number
  chinese_simplified: string
  pinyin: string
  russian_translation: string
  difficulty_level: number
  frequency_rank?: number
  is_active: boolean
}

interface CategoryFormData {
  id?: number
  name: string
  name_russian: string
  description?: string
  description_russian?: string
  difficulty_level: number
  is_active: boolean
  display_order: number
}

export default function ContentManagement() {
  const [content, setContent] = useState<ContentManagementItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  
  // Word editing state
  const [editingWord, setEditingWord] = useState<WordFormData | null>(null)
  const [showWordForm, setShowWordForm] = useState(false)
  const [wordFormLoading, setWordFormLoading] = useState(false)
  
  // Category editing state
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryFormLoading, setCategoryFormLoading] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'words' | 'categories'>('words')

  useEffect(() => {
    loadData()
  }, [selectedCategory])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [contentData, categoriesData] = await Promise.all([
        getAllContent(selectedCategory || undefined),
        getAllCategories()
      ])
      setContent(contentData)
      setCategories(categoriesData)
    } catch (err: any) {
      console.error('Error loading content:', err)
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWord = () => {
    setEditingWord({
      category_id: selectedCategory || categories[0]?.id || 1,
      chinese_simplified: '',
      pinyin: '',
      russian_translation: '',
      difficulty_level: 1,
      frequency_rank: undefined,
      is_active: true
    })
    setShowWordForm(true)
  }

  const handleEditWord = (word: ContentManagementItem) => {
    setEditingWord({
      id: word.id,
      category_id: word.category_id,
      chinese_simplified: word.chinese_simplified,
      pinyin: word.pinyin,
      russian_translation: word.russian_translation,
      difficulty_level: word.difficulty_level,
      frequency_rank: word.frequency_rank,
      is_active: word.is_active
    })
    setShowWordForm(true)
  }

  const handleSaveWord = async () => {
    if (!editingWord) return

    try {
      setWordFormLoading(true)
      
      // Send the word data directly without English translation
      const wordData = {
        ...editingWord
      }
      
      if (editingWord.id) {
        await updateWord(editingWord.id, wordData)
      } else {
        await createWord(wordData)
      }
      setShowWordForm(false)
      setEditingWord(null)
      await loadData()
    } catch (err: any) {
      console.error('Error saving word:', err)
      setError('Ошибка сохранения слова')
    } finally {
      setWordFormLoading(false)
    }
  }

  const handleDeleteWord = async (wordId: number) => {
    const word = content.find(w => w.id === wordId)
    const wordText = word ? `"${word.chinese_simplified} (${word.pinyin})"` : 'это слово'
    
    if (!confirm(`Вы уверены, что хотите удалить слово ${wordText}? Это действие нельзя отменить.`)) return

    try {
      await deleteWord(wordId)
      await loadData()
    } catch (err: any) {
      console.error('Error deleting word:', err)
      setError('Ошибка удаления слова')
    }
  }

  const handleCreateCategory = () => {
    setEditingCategory({
      name: 'default', // Keep for database compatibility but hidden from UI
      name_russian: '',
      description: '',
      description_russian: '',
      difficulty_level: 1,
      is_active: true,
      display_order: categories.length
    })
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      name_russian: category.name_russian,
      description: category.description || '',
      description_russian: category.description_russian || '',
      difficulty_level: category.difficulty_level,
      is_active: category.is_active,
      display_order: category.display_order
    })
    setShowCategoryForm(true)
  }

  const handleSaveCategory = async () => {
    if (!editingCategory) return

    try {
      setCategoryFormLoading(true)
      
      // Use Russian name as English name for database compatibility if needed
      const categoryData = {
        ...editingCategory,
        name: editingCategory.name || editingCategory.name_russian
      }
      
      if (editingCategory.id) {
        await updateCategory(editingCategory.id, categoryData)
      } else {
        await createCategory(categoryData)
      }
      setShowCategoryForm(false)
      setEditingCategory(null)
      await loadData()
    } catch (err: any) {
      console.error('Error saving category:', err)
      setError('Ошибка сохранения категории')
    } finally {
      setCategoryFormLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId)
    const categoryText = category ? `"${category.name_russian} (HSK ${category.difficulty_level})"` : 'эту категорию'
    
    if (!confirm(`Вы уверены, что хотите удалить категорию ${categoryText}? Это действие нельзя отменить.`)) return

    try {
      await deleteCategory(categoryId)
      await loadData()
    } catch (err: any) {
      console.error('Error deleting category:', err)
      setError(err.message || 'Ошибка удаления категории')
    }
  }

  // Filter content based on search
  const filteredContent = content.filter(item => 
    item.chinese_simplified.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.russian_translation.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Ошибка загрузки</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={loadData} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('words')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'words' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="h-4 w-4 inline mr-2" />
          Слова
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'categories' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="h-4 w-4 inline mr-2" />
          Категории
        </button>
      </div>

      {activeTab === 'words' && (
        <>
          {/* Words Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Управление словами
                  </CardTitle>
                  <CardDescription>
                    Создавайте, редактируйте и управляйте словарным запасом
                  </CardDescription>
                </div>
                <Button onClick={handleCreateWord}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить слово
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск по китайскому, пиньину или переводу..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Все категории</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name_russian} (HSK {category.difficulty_level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Words Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Слово</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Категория</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Статистика</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContent.map((word) => (
                      <tr key={word.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="font-bold text-xl text-slate-900">{word.chinese_simplified}</div>
                            <div className="text-sm text-blue-600 font-medium">{word.pinyin}</div>
                            <div className="text-sm text-slate-700">{word.russian_translation}</div>
                            {word.example_sentence_chinese && (
                              <div className="text-xs text-slate-500 italic">
                                {word.example_sentence_chinese}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="font-medium text-slate-900">{word.category_name}</div>
                            <div className="text-xs text-slate-600">HSK {word.category_difficulty}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <BarChart3 className="h-4 w-4 text-slate-400" />
                              <span>{word.usage_stats.total_learners} изучающих</span>
                            </div>
                            <div className="text-xs text-slate-600">
                              {word.usage_stats.average_accuracy}% точность • {word.usage_stats.times_studied} попыток
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditWord(word)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteWord(word.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredContent.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">Слова не найдены</h3>
                    <p className="text-slate-500">
                      {searchQuery || selectedCategory 
                        ? 'Попробуйте изменить критерии поиска или фильтры'
                        : 'Начните добавлять слова в систему'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Word Form Modal */}
          <Modal
            isOpen={showWordForm && !!editingWord}
            onClose={() => setShowWordForm(false)}
            title={editingWord?.id ? 'Редактировать слово' : 'Добавить новое слово'}
            maxWidth="2xl"
          >
            {editingWord && (
              <>
                                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Категория *
                    </label>
                    <select
                      value={editingWord.category_id}
                      onChange={(e) => setEditingWord({...editingWord, category_id: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name_russian} (HSK {category.difficulty_level})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Китайский (упрощенный) *
                    </label>
                    <input
                      type="text"
                      value={editingWord.chinese_simplified}
                      onChange={(e) => setEditingWord({...editingWord, chinese_simplified: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Пиньинь *
                    </label>
                    <input
                      type="text"
                      value={editingWord.pinyin}
                      onChange={(e) => setEditingWord({...editingWord, pinyin: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Русский перевод *
                    </label>
                    <input
                      type="text"
                      value={editingWord.russian_translation}
                      onChange={(e) => setEditingWord({...editingWord, russian_translation: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Уровень сложности
                    </label>
                    <select
                      value={editingWord.difficulty_level}
                      onChange={(e) => setEditingWord({...editingWord, difficulty_level: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map(level => (
                        <option key={level} value={level}>Уровень {level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Рейтинг частотности
                    </label>
                    <input
                      type="number"
                      value={editingWord.frequency_rank || ''}
                      onChange={(e) => setEditingWord({...editingWord, frequency_rank: e.target.value ? parseInt(e.target.value) : undefined})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editingWord.is_active}
                      onChange={(e) => setEditingWord({...editingWord, is_active: e.target.checked})}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                      Активное слово
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
                  <Button 
                    onClick={handleSaveWord} 
                    disabled={wordFormLoading || !editingWord.chinese_simplified || !editingWord.pinyin || !editingWord.russian_translation}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {wordFormLoading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowWordForm(false)}>
                    Отмена
                  </Button>
                </div>
              </>
            )}
          </Modal>
        </>
      )}

      {activeTab === 'categories' && (
        <>
          {/* Categories Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Управление категориями
                  </CardTitle>
                  <CardDescription>
                    Создавайте и управляйте категориями для организации контента
                  </CardDescription>
                </div>
                <Button onClick={handleCreateCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить категорию
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <Card key={category.id} className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            HSK {category.difficulty_level}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            category.is_active 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {category.is_active ? 'Активна' : 'Неактивна'}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-slate-900">{category.name_russian}</h3>
                          <p className="text-sm text-slate-600 font-mono">HSK {category.difficulty_level}</p>
                        </div>
                        
                        {category.description_russian && (
                          <p className="text-sm text-slate-700">{category.description_russian}</p>
                        )}
                        
                        <div className="text-sm text-slate-600">
                          {category.total_words} слов • Порядок: {category.display_order}
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Редактировать
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Категории не найдены</h3>
                  <p className="text-slate-500">Начните с создания первой категории</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Form Modal */}
          <Modal
            isOpen={showCategoryForm && !!editingCategory}
            onClose={() => setShowCategoryForm(false)}
            title={editingCategory?.id ? 'Редактировать категорию' : 'Добавить новую категорию'}
            maxWidth="2xl"
          >
            {editingCategory && (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Название (русский) *
                    </label>
                    <input
                      type="text"
                      value={editingCategory.name_russian}
                      onChange={(e) => setEditingCategory({...editingCategory, name_russian: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Описание (русский)
                    </label>
                    <textarea
                      value={editingCategory.description_russian || ''}
                      onChange={(e) => setEditingCategory({...editingCategory, description_russian: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Уровень сложности (HSK)
                    </label>
                    <select
                      value={editingCategory.difficulty_level}
                      onChange={(e) => setEditingCategory({...editingCategory, difficulty_level: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map(level => (
                        <option key={level} value={level}>HSK {level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Порядок отображения
                    </label>
                    <input
                      type="number"
                      value={editingCategory.display_order}
                      onChange={(e) => setEditingCategory({...editingCategory, display_order: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="category_is_active"
                      checked={editingCategory.is_active}
                      onChange={(e) => setEditingCategory({...editingCategory, is_active: e.target.checked})}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="category_is_active" className="text-sm font-medium text-slate-700">
                      Активная категория
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
                  <Button 
                    onClick={handleSaveCategory} 
                    disabled={categoryFormLoading || !editingCategory.name_russian}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {categoryFormLoading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCategoryForm(false)}>
                    Отмена
                  </Button>
                </div>
              </>
            )}
          </Modal>
        </>
      )}
    </div>
  )
} 