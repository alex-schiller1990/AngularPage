import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  Output,
  EventEmitter,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Emoji from '@tiptap/extension-emoji';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface EmojiCategory {
  name: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Smileys',
    emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','🤩','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕'],
  },
  {
    name: 'Gestures',
    emojis: ['👍','👎','👌','🤌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👋','🤚','🖐️','✋','🖖','👏','🙌','🤲','🙏','✍️','💪','🦾','🖕','💅','🤳'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','❤️‍🔥','❤️‍🩹'],
  },
  {
    name: 'Nature',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🌵','🌲','🌳','🌴','🌿','☘️','🍀','🌺','🌸','🌼','🌻','🌹','🥀','🌷','⭐','🌟','💫','✨','🔥','🌊','🌈','🌙','☀️','⛅','🌤️','⛈️','❄️'],
  },
  {
    name: 'Food',
    emojis: ['🍎','🍊','🍋','🍇','🍓','🍒','🍑','🥭','🍍','🥥','🍉','🍌','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥗','🍜','🍝','🍛','🍣','🍱','🍩','🎂','🍰','🧁','🍫','🍬','🍭','🥤','🧃','☕','🍵','🍺','🥂','🍾'],
  },
  {
    name: 'Travel',
    emojis: ['🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','✈️','🚀','🛸','🚂','⛵','🚢','🏠','🏡','🏰','🗼','🗽','⛪','🏟️','🏔️','🗻','🌋','🏕️','🏖️','🏜️','🌍','🌏','🌎','🗺️'],
  },
  {
    name: 'Objects',
    emojis: ['💻','📱','⌨️','🖥️','🖨️','🖱️','📷','📸','📹','🎥','📞','☎️','📺','📻','🎵','🎶','🎸','🎹','🎺','🎻','🥁','🎮','🕹️','🎲','♟️','🎯','📚','📖','✏️','📝','🔑','🔒','💡','🔦','💰','💳','💎','🏆','🥇','🎁','🎉','🎊','🎈','🔮','🧲','🔭','🔬','💊','💉','🩺','⚙️','🔧','🔨','🪓'],
  },
  {
    name: 'Symbols',
    emojis: ['✅','❌','❎','⭕','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🔺','🔻','🔷','🔶','🔹','🔸','▶️','⏩','⏭️','⏯️','⏸️','⏹️','⏺️','⏪','⏮️','🔁','🔂','🔀','📶','🔔','🔕','💬','💭','🗯️','📣','📢','❗','❓','‼️','⁉️','🆕','🆙','🆒','🆓','🆗','🅰️','🅱️','🆎','🆑','🅾️','🆘','⛔','🚫','🔞','📵','🚭','✔️','➕','➖','➗','✖️','♾️','💯'],
  },
];

@Component({
  selector: 'app-rich-editor',
  imports: [FormsModule, MatTooltipModule],
  templateUrl: './rich-editor.html',
  styleUrl: './rich-editor.css',
})
export class RichEditorComponent implements AfterViewInit, OnDestroy {
  @Input() value = '';
  @Input() label = '';
  @Output() valueChange = new EventEmitter<string>();

  // static: true works because #editorEl is now always in the DOM (hidden via [hidden], not @if)
  @ViewChild('editorEl', { static: true }) editorEl!: ElementRef<HTMLDivElement>;

  protected showSource = signal(false);
  protected showEmojiPicker = signal(false);
  protected sourceHtml = '';

  protected readonly emojiCategories = EMOJI_CATEGORIES;
  protected activeCategory = EMOJI_CATEGORIES[0].name;

  editor!: Editor;

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false, autolink: true }),
        Emoji,
      ],
      content: this.value,
      onUpdate: ({ editor }) => {
        if (!this.showSource()) {
          this.valueChange.emit(editor.getHTML());
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  protected toggleBold(): void {
    this.editor.chain().focus().toggleBold().run();
  }

  protected toggleItalic(): void {
    this.editor.chain().focus().toggleItalic().run();
  }

  protected toggleBulletList(): void {
    this.editor.chain().focus().toggleBulletList().run();
  }

  protected toggleOrderedList(): void {
    this.editor.chain().focus().toggleOrderedList().run();
  }

  protected toggleBlockquote(): void {
    this.editor.chain().focus().toggleBlockquote().run();
  }

  protected setLink(): void {
    const url = prompt('URL:', this.editor.getAttributes('link')['href'] ?? '');
    if (url === null) return;
    if (url === '') {
      this.editor.chain().focus().unsetLink().run();
    } else {
      this.editor.chain().focus().setLink({ href: url }).run();
    }
  }

  protected toggleEmojiPicker(): void {
    this.showEmojiPicker.update(v => !v);
  }

  protected pickEmoji(emoji: string): void {
    this.editor.chain().focus().insertContent(emoji).run();
    this.showEmojiPicker.set(false);
  }

  protected selectCategory(name: string): void {
    this.activeCategory = name;
  }

  protected activeCategoryEmojis(): string[] {
    return this.emojiCategories.find(c => c.name === this.activeCategory)?.emojis ?? [];
  }

  protected toggleSource(): void {
    if (!this.showSource()) {
      // switching TO source view
      this.sourceHtml = this.editor.getHTML();
      this.showSource.set(true);
    } else {
      // switching BACK to rich view
      this.editor.commands.setContent(this.sourceHtml);
      this.valueChange.emit(this.sourceHtml);
      this.showSource.set(false);
    }
  }

  protected isActive(type: string, attrs?: Record<string, unknown>): boolean {
    return this.editor?.isActive(type, attrs) ?? false;
  }
}
