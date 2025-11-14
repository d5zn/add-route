#!/usr/bin/env python3
"""
Локальная проверка синхронизации шаблонов (без подключения к БД).
Сравнивает fallback-шаблоны из app-addicted-logic.js с mock-шаблонами в админке.
"""

import json
import re

def extract_fallback_templates():
    """Извлечь fallback-шаблоны из app-addicted-logic.js"""
    try:
        with open('app-addicted-logic.js', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Найти метод getTemplateDefinitions
        match = re.search(r'getTemplateDefinitions\(\)\s*{[^}]*return\s*({[\s\S]*?});', content)
        if not match:
            print('❌ Не удалось найти метод getTemplateDefinitions в app-addicted-logic.js')
            return None
        
        # Извлечь структуру шаблонов
        templates_str = match.group(1)
        
        # Парсим вручную (так как это не валидный JSON)
        templates = {}
        
        # Найти блоки клубов
        club_blocks = re.findall(r"'([^']+)':\s*\[([^\]]+)\]", templates_str, re.DOTALL)
        
        for club_id, block in club_blocks:
            templates[club_id] = []
            
            # Найти все шаблоны в блоке
            template_blocks = re.findall(r'\{([^}]+)\}', block)
            
            for template_block in template_blocks:
                # Извлечь id и name
                id_match = re.search(r"id:\s*'([^']+)'", template_block)
                name_match = re.search(r"name:\s*'([^']+)'", template_block)
                desc_match = re.search(r"description:\s*'([^']+)'", template_block)
                
                if id_match and name_match:
                    templates[club_id].append({
                        'id': id_match.group(1),
                        'name': name_match.group(1),
                        'description': desc_match.group(1) if desc_match else ''
                    })
        
        return templates
    except FileNotFoundError:
        print('❌ Файл app-addicted-logic.js не найден')
        return None
    except Exception as e:
        print(f'❌ Ошибка при чтении fallback-шаблонов: {e}')
        return None

def extract_mock_templates():
    """Извлечь mock-шаблоны из админки"""
    try:
        with open('admin/src/data/mockClubs.ts', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Проверить, есть ли mock-шаблоны
        if 'mockTemplates: Template[] = []' in content:
            print('ℹ️  Mock-шаблоны в админке пусты (используются только данные из API)')
            return {}
        
        # Найти массив mockTemplates
        match = re.search(r'export const mockTemplates[^[]*\[([^\]]*)\]', content, re.DOTALL)
        if not match:
            return {}
        
        templates_str = match.group(1)
        
        # Простой парсинг строк createTemplateDraft
        templates = {}
        template_calls = re.findall(
            r"createTemplateDraft\(\s*\{\s*(?:id:\s*'([^']*)',\s*)?clubId:\s*(?:mockClubs\[(\d+)\]\.id|'([^']+)'),\s*name:\s*'([^']+)'",
            templates_str
        )
        
        for template_id, club_idx, club_id_direct, name in template_calls:
            # Определить club_id
            if club_id_direct:
                club_id = club_id_direct
            else:
                # mockClubs[0] = hedonism, mockClubs[1] = not-in-paris
                club_id = 'hedonism' if club_idx == '0' else 'not-in-paris'
            
            if club_id not in templates:
                templates[club_id] = []
            
            templates[club_id].append({
                'id': template_id if template_id else f'mock-{len(templates[club_id])}',
                'name': name,
                'description': ''
            })
        
        return templates
    except FileNotFoundError:
        print('❌ Файл admin/src/data/mockClubs.ts не найден')
        return None
    except Exception as e:
        print(f'❌ Ошибка при чтении mock-шаблонов: {e}')
        return None

def compare_templates():
    """Сравнить fallback и mock шаблоны"""
    print('\n' + '='*80)
    print('🔍 ЛОКАЛЬНАЯ ПРОВЕРКА СИНХРОНИЗАЦИИ ШАБЛОНОВ')
    print('='*80 + '\n')
    
    fallback = extract_fallback_templates()
    mock = extract_mock_templates()
    
    if fallback is None or mock is None:
        return
    
    print('📊 СРАВНЕНИЕ ШАБЛОНОВ:\n')
    
    all_clubs = set(list(fallback.keys()) + list(mock.keys()))
    
    for club_id in sorted(all_clubs):
        print(f'📁 Клуб: {club_id}')
        print('  ' + '-'*76)
        
        fallback_templates = fallback.get(club_id, [])
        mock_templates = mock.get(club_id, [])
        
        print(f'\n  📝 Fallback-шаблоны (основное приложение):')
        if not fallback_templates:
            print(f'    ❌ Нет fallback-шаблонов!')
        else:
            for t in fallback_templates:
                print(f'    - {t["name"]:30} (id: {t["id"]})')
                if t['description']:
                    print(f'      {t["description"][:70]}')
        
        print(f'\n  💾 Mock-шаблоны (админка):')
        if not mock_templates:
            print(f'    ✅ Пустые (используются данные из API)')
        else:
            for t in mock_templates:
                print(f'    - {t["name"]:30} (id: {t["id"]})')
        
        print(f'\n  🔄 Анализ:')
        
        if not mock_templates:
            print(f'    ✅ Mock-шаблоны отключены - админка будет использовать данные из БД')
            print(f'    ✅ После синхронизации fallback в БД всё будет работать корректно')
        elif not fallback_templates:
            print(f'    ⚠️  Нет fallback-шаблонов в основном приложении')
            print(f'       Клуб не будет работать без БД!')
        else:
            # Сравниваем шаблоны
            fallback_names = {t['name'] for t in fallback_templates}
            mock_names = {t['name'] for t in mock_templates}
            
            matching = fallback_names & mock_names
            only_fallback = fallback_names - mock_names
            only_mock = mock_names - fallback_names
            
            if matching:
                print(f'    ✅ Совпадающие шаблоны: {", ".join(sorted(matching))}')
            
            if only_fallback:
                print(f'    ⚠️  Только в fallback: {", ".join(sorted(only_fallback))}')
            
            if only_mock:
                print(f'    ❌ Только в mock: {", ".join(sorted(only_mock))}')
                print(f'       → Эти шаблоны НЕ соответствуют основному приложению!')
            
            if not matching and (only_fallback or only_mock):
                print(f'    ❌ НЕСООТВЕТСТВИЕ! Шаблоны различаются')
        
        print('\n')
    
    print('='*80)
    print('💡 РЕКОМЕНДАЦИИ')
    print('='*80 + '\n')
    
    has_mock_templates = any(mock.get(club_id) for club_id in all_clubs)
    
    if has_mock_templates:
        print('⚠️  Mock-шаблоны в админке НЕ соответствуют fallback-шаблонам!\n')
        print('Решение:')
        print('  1. Mock-шаблоны уже убраны в admin/src/data/mockClubs.ts')
        print('  2. Пересоберите админку: cd admin && npm run build')
        print('  3. На сервере запустите: python3 sync_fallback_templates.py')
        print('  4. Проверьте результат: python3 compare_templates.py')
    else:
        print('✅ Mock-шаблоны отключены - правильная конфигурация!\n')
        print('Следующие шаги:')
        print('  1. Пересоберите админку: cd admin && npm run build')
        print('  2. На сервере с DATABASE_URL запустите:')
        print('     python3 sync_fallback_templates.py')
        print('  3. Проверьте синхронизацию:')
        print('     python3 check_templates.py')
    
    print('\n' + '='*80 + '\n')
    
    print('📚 Подробная информация:')
    print('  - ДИАГНОСТИКА_СИНХРОНИЗАЦИИ.md - полное описание проблемы')
    print('  - docs/TEMPLATE_SYNC_FIX.md - подробное решение')
    print('  - /route/admin/sync - веб-интерфейс синхронизации\n')

if __name__ == '__main__':
    compare_templates()

