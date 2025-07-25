import {CommonModule, NgOptimizedImage} from "@angular/common";
import {Component, inject, Input, OnDestroy, OnInit, TrackByFunction,} from "@angular/core";
import {MessageInputFieldComponent} from "../../shared/message-input-field/message-input-field.component";
import {ChatService} from "../../services/chat.service";
import {Message} from "../../interfaces/message.interface";
import {Timestamp} from "@angular/fire/firestore";
import {HelperService} from "../../services/helper.service";
import {UserData} from "../../interfaces/user.interface";
import {firstValueFrom, map, Observable, Subscription} from "rxjs";
import {UserService} from "../../services/user.service";
import {ChatMessageComponent} from "../chat/chat-message-other/chat-message.component";
import {AutoScrollingDirective} from "../../directive/auto-scrolling.directive";

@Component({
	selector: "app-thread",
	imports: [CommonModule, MessageInputFieldComponent, ChatMessageComponent, NgOptimizedImage, AutoScrollingDirective, AutoScrollingDirective],
	templateUrl: "./thread.component.html",
	styleUrl: "./thread.component.scss",
	standalone: true
})
export class ThreadComponent implements OnInit, OnDestroy {
	@Input() isThisAThreadMessage!: boolean;

	currentUser!: UserData;
	userSubscription!: Subscription;
	userService: UserService = inject(UserService);
	helperService: HelperService = inject(HelperService);
	chatService: ChatService = inject(ChatService);
	messages$: Observable<Message[]>;
	messages!: Message[];
	threadChannelName: string | undefined;

	constructor() {
		this.messages$ = this.chatService.getThreadMessages(
			this.chatService.selectedChannel.channelId.toString(),
			this.chatService.selectedThreadMessageId
		);
	}

	trackByMessageId: TrackByFunction<Message> = (
		index: number,
		message: Message
	) => {
		return (message as any).id || index;
	};

	shouldShowDate(messages: Message[], index: number): boolean {
		if (index === 0) return true;
		return messages[index].date !== messages[index - 1].date;
	}

	ngOnInit() {
		this.userSubscription = this.userService.currentUser$.subscribe(
			(userData) => {
				if (userData) {
					this.currentUser = userData;
				}
			}
		);
		this.threadChannelName = this.chatService.selectedChannel.channelName;

		this.messages$.subscribe((megs) => {
			this.messages = megs;
		});
	}

	handleThread() {
		this.chatService.handleThread(false);
		if (window.innerWidth <= 1024) {
			const chatElement = document.querySelector('app-chat');
			if (chatElement) {
				(chatElement as HTMLElement).style.display = '';
			}
		}
	}

	async returnThreadAnswerCount(): Promise<number> {
		if (!this.messages$) return -1;
		return await firstValueFrom(
			this.messages$.pipe(map((messages) => messages.length + 1))
		);
	}

	async sendThreadMessage(content: string): Promise<void> {
		if (!this.chatService.selectedChannel || !content.trim()) {
			return console.info(this.chatService.selectedChannel);
		}
		const message: Message = {
			text: content,
			uid: this.currentUser.uid,
			edited: false,
			timestamp: Timestamp.fromDate(new Date()),
			time: this.helperService.getBerlinTime24h(),
			date: this.helperService.getBerlinDateFormatted(),
			reactions: [],
		};
		try {
			await this.chatService.updateThreadMessagesInformation(
				this.helperService.getBerlinTime24h(),
				await this.returnThreadAnswerCount()
			);
			await this.chatService.updateThreadMessagesName();
			await this.returnThreadAnswerCount();
			await this.chatService.sendThreadMessage(
				this.chatService.selectedChannel.channelId.toString(),
				this.chatService.selectedThreadMessageId,
				message
			);
		} catch (error) {
			console.error("Error sending message:", error);
		}
	}

	ngOnDestroy() {
		this.userSubscription.unsubscribe();
	}
}
