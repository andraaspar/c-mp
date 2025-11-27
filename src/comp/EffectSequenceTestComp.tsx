import { Show } from '../c-mp/comp/Show'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { useEffect } from '../c-mp/fun/useEffect'
import { mutateState, useState } from '../c-mp/fun/useState'

export const EffectSequenceTestComp = defineComponent<{}>(
	'EffectSequenceTestComp',
	(props, $) => {
		const stateA = useState('stateA', {
			value: { count: 0 },
		})
		const stateB = useState('stateB', {
			value: undefined as { count: number } | undefined,
		})

		useEffect('stateB changed [t6e0cf]', () => {
			mutateState($.debugName, 'set stateB to stateA [t6dslx]', () => {
				stateB.value = stateA.value.count % 2 === 0 ? stateA.value : undefined
			})
		})

		$.append(
			<>
				<div>
					State B:{' '}
					<Show
						debugName='stateB.value'
						when={() => stateB.value}
						then={() => (
							<Slot
								debugName='stateB.value!.count'
								get={() => stateB.value!.count + ''}
							/>
						)}
						else={() => '–'}
					/>
				</div>
				<button
					onclick={() => {
						mutateState($.debugName, 'increment stateA [t6dsj1]', () => {
							stateA.value.count++
						})
					}}
				>
					Increment State A
				</button>
			</>,
		)

		return $
	},
)
