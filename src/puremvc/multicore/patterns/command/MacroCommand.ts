import { CommandConstructor, ICommand, INotification, INotifier } from "../../interfaces";
import { Notifier } from "../observer";

/**
 * A base <code>ICommand</code> implementation that executes other <code>ICommand</code>s.
 *
 * A <code>MacroCommand</code> maintains an list of <code>ICommand</code> constructor references
 * called <i>SubCommand</i>s.
 *
 * When <code>execute</code> is called, the <code>MacroCommand</code> instantiates and calls
 * <code>execute</code> on each of its <i>SubCommands</i> turn. Each <i>SubCommand</i> will be
 * passed a reference to the original <code>INotification</code> that was passed to the
 * <code>MacroCommand</code>'s <code>execute</code> method.
 *
 * Unlike <code>SimpleCommand</code>, your subclass should not override <code>execute</code>,
 * but instead, should override the <code>initializeMacroCommand</code> method, calling
 * <code>addSubCommand</code> once for each <i>SubCommand</i> to be executed.
 */
export class MacroCommand
	extends Notifier
	implements ICommand, INotifier
{
	/**
	 * An array of <code>ICommand</code>s.
	 *
	 * @protected
	 */
	#subCommands: CommandConstructor[];

	#sequentialExecution: boolean;
	
	/**
	 * Constructs a <code>MacroCommand</code> instance.
	 *
	 * You should not need to define a constructor in your subclasses, instead, override the
	 * <code>initializeMacroCommand</code> method.
	 *
	 * If your subclass does define a constructor, be  sure to call <code>super()</code>.
	 */
	constructor(sequentialExeuction: boolean = false)
	{
		super();

		this.#sequentialExecution = sequentialExeuction;
		this.#subCommands = [];
		this.initializeMacroCommand();
	}

	/**
	 * Initialize the <code>MacroCommand</code>.
	 * 
	 * In your subclass, override this method to  initialize the <code>MacroCommand</code>'s
	 * <i>subCommand</i> list with <code>ICommand</code> class references like this:
	 * 
	 * <pre>
	 *		// Initialize MyMacroCommand
	 *		initializeMacroCommand():void
	 *		{
	 *			this.addSubCommand( FirstCommand );
	 *			this.addSubCommand( SecondCommand );
	 *			this.addSubCommand( ThirdCommand );
	 *		}
	 * </pre>
	 * 
	 * Note that <i>subCommand</i>s may be any <code>ICommand</code> implementor so
	 * <code>MacroCommand</code>s or <code>SimpleCommand</code>s are both acceptable.
 	 *
	 * @protected
	 */
	protected initializeMacroCommand():void
	{
	
	}

	/**
	 * Add an entry to the <i>subCommands</i> list.
	 * 
	 * The <i>subCommands</i> will be called in First In/First Out (FIFO) order.
	 * 
	 * @param commandClassRef
	 *		A reference to the constructor of the <code>ICommand</code>.
	 *
	 * @protected
	 */
	public addSubCommand(commandClass:CommandConstructor):void
	{
		this.#subCommands.push(commandClass);
	}

	/** 
	 * Execute this <code>MacroCommand</code>'s <i>SubCommands</i>.
	 *
	 * The <i>SubCommands</i> will be called in First In/First Out (FIFO)
	 * order. 
	 * 
	 * @param notification
	 *		The <code>INotification</code> object to be passed to each <i>SubCommand</i> of
	 *		the list.
	 *
	 * @final
	 */
	public async execute( notification:INotification ): Promise<void>
	{
		const subCommands = this.#subCommands.slice(0);

		if (!this.#sequentialExecution)
		{
			await Promise.allSettled(this.#subCommands.map((commandClass) =>
			{
				const commandInstance:ICommand = new commandClass();

				commandInstance.initializeNotifier(this.multitonKey);
				return commandInstance.execute(notification);
			}));
		}
		else
		{
			for (let i = 0; i < subCommands.length; i++)
			{
				const commandClass = subCommands[i];
				const commandInstance:ICommand = new commandClass();

				commandInstance.initializeNotifier(this.multitonKey);
				await commandInstance.execute(notification);
			}
		}
	}
}