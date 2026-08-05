import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  Output,
  EventEmitter,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Emoji from '@tiptap/extension-emoji';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpoilerBlock, SpoilerTitle, fromStorageHTML, toStorageHTML } from './spoiler-block.extension';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichEditorComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  /** Initial HTML content — only read once at ngAfterViewInit. Changes after init are ignored (Tiptap owns the content). */
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  // static: true works because #editorEl is now always in the DOM (hidden via [hidden], not @if)
  @ViewChild('editorEl', { static: true }) editorEl!: ElementRef<HTMLDivElement>;

  protected showSource = signal(false);
  protected showEmojiPicker = signal(false);
  protected sourceHtml = '';

  protected readonly emojiCategories = EMOJI_CATEGORIES;
  protected activeCategory = EMOJI_CATEGORIES[0].name;

  // Toolbar active-state signals — updated via onTransaction to avoid NG0100
  protected readonly isBold = signal(false);
  protected readonly isItalic = signal(false);
  protected readonly isBulletList = signal(false);
  protected readonly isOrderedList = signal(false);
  protected readonly isBlockquote = signal(false);
  protected readonly isLink = signal(false);
  protected readonly isSpoiler = signal(false);

  editor!: Editor;

  ngAfterViewInit(): void {
    // Run editor setup outside Angular's zone so Tiptap's internal callbacks
    // (onTransaction fires on every keypress/cursor move) never trigger change detection.
    this.zone.runOutsideAngular(() => {
      this.editor = new Editor({
        element: this.editorEl.nativeElement,
        extensions: [
          StarterKit,
          Link.configure({ openOnClick: false, autolink: true }),
          Emoji,
          SpoilerBlock,
          SpoilerTitle,
        ],
        // Convert storage HTML (<details>) → editor HTML (divs) before loading
        content: fromStorageHTML(this.value),
        onUpdate: ({ editor }) => {
          if (!this.showSource()) {
            // Convert editor HTML (divs) → storage HTML (<details>) before emitting
            this.zone.run(() => this.valueChange.emit(toStorageHTML(editor.getHTML())));
          }
        },
        onTransaction: ({ editor }) => {
          this.isBold.set(editor.isActive('bold'));
          this.isItalic.set(editor.isActive('italic'));
          this.isBulletList.set(editor.isActive('bulletList'));
          this.isOrderedList.set(editor.isActive('orderedList'));
          this.isBlockquote.set(editor.isActive('blockquote'));
          this.isLink.set(editor.isActive('link'));
          this.isSpoiler.set(editor.isActive('spoilerBlock'));
        },
      });
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

  protected insertSpoiler(): void {
    this.editor.chain().focus().insertSpoilerBlock().run();
  }

  protected deleteSpoiler(): void {
    this.editor.chain().focus().deleteSpoilerBlock().run();
  }


  protected toggleSource(): void {
    if (!this.showSource()) {
      // Show storage HTML (readable <details> format) in the textarea
      this.sourceHtml = toStorageHTML(this.editor.getHTML());
      this.showSource.set(true);
    } else {
      // Parse storage HTML back to editor format before loading
      const editorHtml = fromStorageHTML(this.sourceHtml);
      this.editor.commands.setContent(editorHtml);
      this.valueChange.emit(this.sourceHtml);
      this.showSource.set(false);
    }
  }

}
